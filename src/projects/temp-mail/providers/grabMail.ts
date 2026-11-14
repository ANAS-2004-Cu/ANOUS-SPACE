import {
  clearAccountStorage,
  readAccountStorage,
  writeAccountStorage,
} from '../storage';
import {
  EmailAttachment,
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  ProviderCapabilities,
  TempAccount,
} from '../types';
import {
  ProviderHttpError,
  fetchBinary,
  fetchJson,
  generateRandomUsername,
  parseSender,
  safeIsoDate,
  sanitizeUsername,
  stripHtml,
  triggerBlobDownload,
  wrapPlainTextAsHtml,
} from './http';

const GRABMAIL_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'api',
  supportsCustomUsername: true,
  supportsDelete: true,
  inlineMessageBody: false,
  supportsAttachments: true,
  protocol: 'rest',
};

const FALLBACK_GRABMAIL_DOMAINS = ['grabmail.io', 'mixozia.com', 'linqmail.com'];

const proxyUrl = (path: string) => `/api/grabmail?path=${encodeURIComponent(path)}`;

interface GrabMailAttachmentRaw {
  id?: string | number;
  filename?: string;
  name?: string;
  content_type?: string;
  contentType?: string;
  size?: number;
  url?: string;
}

interface GrabMailMessageRaw {
  id?: string | number;
  from?: unknown;
  to?: unknown;
  subject?: string;
  preview?: string;
  text?: string;
  html?: string;
  date?: string | number;
  created_at?: string | number;
  seen?: boolean;
  hasAttachments?: boolean;
  attachments?: GrabMailAttachmentRaw[] | number;
}

export const grabMailAdapter: MailProviderAdapter = {
  id: 'grabmail.io',
  capabilities: GRABMAIL_CAPABILITIES,

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetchJson<{ public?: string[]; domains?: string[] } | string[]>(
        proxyUrl('/domains')
      );
      const list = Array.isArray(res) ? res : res?.public || res?.domains || [];
      const cleaned = list
        .map((d) => String(d || '').trim())
        .filter((d) => d.includes('.'));
      if (cleaned.length > 0) return cleaned;
    } catch {
      // Fallback to verified public domains
    }
    return FALLBACK_GRABMAIL_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('grabmail.io');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    let targetDomain = (domain || '').trim();
    if (!targetDomain) {
      const domains = await this.getDomains!();
      targetDomain = domains[0] || FALLBACK_GRABMAIL_DOMAINS[0];
    }

    const address = `${cleanUser}@${targetDomain}`;
    const account: TempAccount = {
      provider: 'grabmail.io',
      address,
      emailUser: cleanUser,
      mailbox: address,
      domain: targetDomain,
    };

    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('grabmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active GrabMail address configured.', 401, 'unauthorized');
    }

    const res = await fetchJson<{ messages?: GrabMailMessageRaw[] } | GrabMailMessageRaw[]>(
      proxyUrl(`/mailbox?address=${encodeURIComponent(account.address)}`)
    );

    const list = Array.isArray(res) ? res : res?.messages || [];
    return list.map((msg) => {
      const sender = parseSender(msg.from);
      const textBody = msg.text || msg.preview || '';
      const hasAtt = Array.isArray(msg.attachments)
        ? msg.attachments.length > 0
        : Number(msg.attachments || 0) > 0 || Boolean(msg.hasAttachments);

      return {
        id: String(msg.id ?? ''),
        fromName: sender.name,
        fromAddress: sender.address,
        subject: msg.subject || '(No subject)',
        preview: textBody.slice(0, 120),
        receivedAt: safeIsoDate(msg.date ?? msg.created_at),
        hasAttachments: hasAtt,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('grabmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active GrabMail address configured.', 401, 'unauthorized');
    }

    const msg = await fetchJson<GrabMailMessageRaw>(
      proxyUrl(`/message/${encodeURIComponent(id)}?mailbox=${encodeURIComponent(account.address)}`)
    );

    const sender = parseSender(msg.from);
    const htmlContent = msg.html || '';
    const textContent = msg.text || (htmlContent ? stripHtml(htmlContent) : '');
    const toAddresses = Array.isArray(msg.to)
      ? msg.to.map((item) => parseSender(item).address).filter(Boolean)
      : typeof msg.to === 'string' && msg.to
        ? [msg.to]
        : [account.address];

    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((att, idx) => {
          const attId = String(att.id ?? idx);
          const rawUrl = String(att.url || '').trim();
          let relativePath = '';
          if (rawUrl) {
            relativePath = rawUrl.replace(/^https?:\/\/[^/]+\/api\/v1/i, '');
            if (!relativePath.startsWith('/')) {
              relativePath = `/${relativePath.replace(/^\/+/, '')}`;
            }
          } else {
            relativePath = `/attachment/${encodeURIComponent(attId)}?mailbox=${encodeURIComponent(account.address)}&message_id=${encodeURIComponent(id)}`;
          }

          return {
            id: attId,
            filename: att.filename || att.name || `attachment-${idx + 1}`,
            contentType: att.content_type || att.contentType || 'application/octet-stream',
            size: Number(att.size || 0),
            downloadUrl: relativePath,
          };
        })
      : [];

    return {
      id: String(msg.id ?? id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.date ?? msg.created_at),
      hasAttachments: attachments.length > 0,
      toAddresses,
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments,
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const account = await readAccountStorage('grabmail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active GrabMail address configured.', 401, 'unauthorized');
    }

    await fetchJson(
      proxyUrl(`/message/${encodeURIComponent(id)}?mailbox=${encodeURIComponent(account.address)}`),
      { method: 'DELETE' }
    );
  },

  async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
    if (!downloadUrl) {
      throw new ProviderHttpError('Attachment download URL is missing.', 400, 'upstream');
    }
    const blob = await fetchBinary(proxyUrl(downloadUrl));
    triggerBlobDownload(blob, filename || 'attachment');
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('grabmail.io');
  },
};
