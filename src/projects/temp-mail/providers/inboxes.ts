import {
  clearAccountStorage,
  readAccountStorage,
  writeAccountStorage,
} from '../storage';
import {
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  ProviderCapabilities,
  TempAccount,
} from '../types';
import {
  ProviderHttpError,
  fetchJson,
  generateRandomUsername,
  parseSender,
  safeIsoDate,
  sanitizeUsername,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const INBOXES_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'api',
  supportsCustomUsername: true,
  supportsDelete: false,
  inlineMessageBody: false,
  supportsAttachments: false,
  protocol: 'rest',
};

const FALLBACK_INBOXES_DOMAINS = ['bltiwd.com', 'inboxes.com'];

const proxyUrl = (path: string) => `/api/inboxes?path=${encodeURIComponent(path)}`;

interface InboxesDomainItem {
  qdn?: string;
  domain?: string;
}

interface InboxesMessageRaw {
  uid?: string;
  id?: string;
  f?: string;
  from?: unknown;
  ff?: string[];
  s?: string;
  subject?: string;
  cr?: string;
  createdAt?: string;
  rr?: string;
  text?: string;
  html?: string;
  cmd?: unknown;
  to?: unknown;
}

export const inboxesAdapter: MailProviderAdapter = {
  id: 'inboxes.com',
  capabilities: INBOXES_CAPABILITIES,

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetchJson<{ domains?: Array<InboxesDomainItem | string> } | Array<InboxesDomainItem | string>>(
        proxyUrl('/domain')
      );
      const rawList = Array.isArray(res) ? res : res?.domains || [];
      const parsed = rawList
        .map((item) => (typeof item === 'string' ? item : item?.qdn || item?.domain || ''))
        .filter((d) => Boolean(d && d.includes('.')));
      if (parsed.length > 0) return parsed;
    } catch {
      // Fallback to default domain if API fails temporarily
    }
    return FALLBACK_INBOXES_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('inboxes.com');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    let targetDomain = (domain || '').trim();
    if (!targetDomain) {
      const domains = await this.getDomains!();
      targetDomain = domains[0] || 'bltiwd.com';
    }

    const account: TempAccount = {
      provider: 'inboxes.com',
      address: `${cleanUser}@${targetDomain}`,
      emailUser: cleanUser,
      mailbox: cleanUser,
      domain: targetDomain,
    };
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('inboxes.com');
    if (!account?.address) {
      throw new ProviderHttpError('No active Inboxes.com address configured.', 401, 'unauthorized');
    }

    const res = await fetchJson<{ msgs?: InboxesMessageRaw[] } | InboxesMessageRaw[]>(
      proxyUrl(`/inbox/${encodeURIComponent(account.address)}`)
    );
    const msgs = Array.isArray(res) ? res : res?.msgs || [];

    return msgs.map((msg) => {
      const sender = parseSender(msg.f ?? msg.from ?? msg.ff);
      return {
        id: String(msg.uid || msg.id || ''),
        fromName: sender.name,
        fromAddress: sender.address,
        subject: msg.s || msg.subject || '(No subject)',
        preview: msg.text ? msg.text.slice(0, 120) : '',
        receivedAt: safeIsoDate(msg.cr || msg.rr || msg.createdAt),
        hasAttachments: false,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('inboxes.com');
    const msg = await fetchJson<InboxesMessageRaw>(
      proxyUrl(`/message/${encodeURIComponent(id)}`)
    );

    const sender = parseSender(msg.f ?? msg.from ?? msg.ff);
    const htmlContent = msg.html || '';
    const textContent = msg.text || (htmlContent ? stripHtml(htmlContent) : '');
    const toList = Array.isArray(msg.to)
      ? msg.to.map((item) => parseSender(item).address).filter(Boolean)
      : account?.address
        ? [account.address]
        : [];

    return {
      id: String(msg.uid || msg.id || id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.s || msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.cr || msg.rr || msg.createdAt),
      hasAttachments: false,
      toAddresses: toList,
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments: [],
    };
  },

  async deleteMessage(): Promise<void> {
    throw new ProviderHttpError(
      'Inboxes.com automatically deletes messages upon expiration.',
      405,
      'upstream'
    );
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('inboxes.com');
  },
};
