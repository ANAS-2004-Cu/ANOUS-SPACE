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

const CATCHMAIL_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'fixed',
  fixedDomains: ['catchmail.io'],
  supportsCustomUsername: true,
  supportsDelete: true,
  inlineMessageBody: false,
  supportsAttachments: false,
  protocol: 'rest',
};

const proxyUrl = (path: string) => `/api/catchmail?path=${encodeURIComponent(path)}`;

interface CatchmailMessageRaw {
  id?: string | number;
  _id?: string;
  uid?: string;
  from?: unknown;
  sender?: unknown;
  to?: unknown;
  subject?: string;
  intro?: string;
  preview?: string;
  snippet?: string;
  text?: string;
  body_text?: string;
  body?: string;
  html?: string;
  body_html?: string;
  created_at?: string | number;
  createdAt?: string | number;
  date?: string | number;
  receivedAt?: string | number;
  hasAttachments?: boolean;
  attachments?: unknown[];
}

function unwrapCatchmailMessages(raw: unknown): CatchmailMessageRaw[] {
  if (Array.isArray(raw)) return raw as CatchmailMessageRaw[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const candidate = obj.messages || obj.mails || obj.data || obj.items || obj.emails;
    if (Array.isArray(candidate)) return candidate as CatchmailMessageRaw[];
  }
  return [];
}

function unwrapCatchmailDetail(raw: unknown): CatchmailMessageRaw {
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.message && typeof obj.message === 'object') return obj.message as CatchmailMessageRaw;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as CatchmailMessageRaw;
    }
    return obj as CatchmailMessageRaw;
  }
  return {};
}

export const catchmailAdapter: MailProviderAdapter = {
  id: 'catchmail.io',
  capabilities: CATCHMAIL_CAPABILITIES,

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('catchmail.io');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const trimmed = (username || '').trim();
    let address: string;
    let emailUser: string;
    let targetDomain: string;

    if (trimmed.includes('@')) {
      const [u, d] = trimmed.split('@');
      emailUser = sanitizeUsername(u);
      targetDomain = (d || domain || 'catchmail.io').trim().toLowerCase() || 'catchmail.io';
      address = `${emailUser}@${targetDomain}`;
    } else {
      emailUser = trimmed ? sanitizeUsername(trimmed) : generateRandomUsername(10);
      targetDomain = (domain || 'catchmail.io').trim().toLowerCase() || 'catchmail.io';
      address = `${emailUser}@${targetDomain}`;
    }

    const account: TempAccount = {
      provider: 'catchmail.io',
      address,
      emailUser,
      mailbox: address,
      domain: targetDomain,
    };
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('catchmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active Catchmail address configured.', 401, 'unauthorized');
    }

    const res = await fetchJson<unknown>(
      proxyUrl(`/mailbox?address=${encodeURIComponent(account.address)}`)
    );
    const items = unwrapCatchmailMessages(res);

    return items.map((msg) => {
      const sender = parseSender(msg.from ?? msg.sender);
      const textBody = String(msg.text || msg.body_text || msg.body || '');
      const htmlBody = String(msg.html || msg.body_html || '');
      const preview =
        msg.preview ||
        msg.intro ||
        msg.snippet ||
        (textBody || stripHtml(htmlBody)).slice(0, 120);

      return {
        id: String(msg.id ?? msg._id ?? msg.uid ?? ''),
        fromName: sender.name,
        fromAddress: sender.address,
        subject: msg.subject || '(No subject)',
        preview,
        receivedAt: safeIsoDate(msg.created_at ?? msg.createdAt ?? msg.date ?? msg.receivedAt),
        hasAttachments: Boolean(
          msg.hasAttachments || (Array.isArray(msg.attachments) && msg.attachments.length > 0)
        ),
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('catchmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active Catchmail address configured.', 401, 'unauthorized');
    }

    const res = await fetchJson<unknown>(
      proxyUrl(
        `/message/${encodeURIComponent(id)}?mailbox=${encodeURIComponent(account.address)}`
      )
    );
    const msg = unwrapCatchmailDetail(res);
    const sender = parseSender(msg.from ?? msg.sender);
    const htmlContent = String(msg.html || msg.body_html || '');
    const textContent = String(
      msg.text || msg.body_text || msg.body || (htmlContent ? stripHtml(htmlContent) : '')
    );

    const toAddresses = Array.isArray(msg.to)
      ? msg.to.map((t) => parseSender(t).address || String(t)).filter(Boolean)
      : typeof msg.to === 'string' && msg.to
        ? [msg.to]
        : [account.address];

    return {
      id: String(msg.id ?? msg._id ?? msg.uid ?? id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.created_at ?? msg.createdAt ?? msg.date ?? msg.receivedAt),
      hasAttachments: false,
      toAddresses,
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments: [],
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const account = await readAccountStorage('catchmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active Catchmail address configured.', 401, 'unauthorized');
    }

    await fetchJson(
      proxyUrl(
        `/message/${encodeURIComponent(id)}?mailbox=${encodeURIComponent(account.address)}`
      ),
      { method: 'DELETE' }
    );
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('catchmail.io');
  },
};
