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

export const TEMPMAIL_PLUS_DOMAINS = [
  'mailto.plus',
  'fexpost.com',
  'fexbox.org',
  'mailbox.in.ua',
  'rover.info',
  'fextemp.com',
  'any.pink',
  'merepost.com',
] as const;

const TEMPMAIL_PLUS_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'fixed',
  fixedDomains: TEMPMAIL_PLUS_DOMAINS,
  supportsCustomUsername: true,
  supportsDelete: true,
  inlineMessageBody: false,
  supportsAttachments: true,
  protocol: 'rest',
};

const proxyUrl = (path: string) => `/api/tempmail-plus?path=${encodeURIComponent(path)}`;

interface TempMailPlusListItem {
  mail_id?: string | number;
  id?: string | number;
  from_name?: string;
  from_mail?: string;
  from?: unknown;
  subject?: string;
  text?: string;
  html?: string;
  time?: string | number;
  date?: string | number;
  is_new?: boolean;
  attachments?: unknown[];
}

interface TempMailPlusDetailRaw extends TempMailPlusListItem {
  to?: unknown;
  attachments?: Array<{
    attachment_id?: string | number;
    id?: string | number;
    name?: string;
    filename?: string;
    content_type?: string;
    size?: number;
  }>;
}

export const tempmailPlusAdapter: MailProviderAdapter = {
  id: 'tempmail.plus',
  capabilities: TEMPMAIL_PLUS_CAPABILITIES,

  async getDomains(): Promise<string[]> {
    return [...TEMPMAIL_PLUS_DOMAINS];
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('tempmail.plus');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    const targetDomain = (domain || '').trim() || TEMPMAIL_PLUS_DOMAINS[0];
    const address = `${cleanUser}@${targetDomain}`;

    await fetchJson(proxyUrl(`/mails/?email=${encodeURIComponent(address)}&limit=1&epin=`));

    const account: TempAccount = {
      provider: 'tempmail.plus',
      address,
      emailUser: cleanUser,
      mailbox: cleanUser,
      domain: targetDomain,
    };
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('tempmail.plus');
    if (!account?.address) {
      throw new ProviderHttpError('No active TempMail.Plus inbox configured.', 401, 'unauthorized');
    }

    const res = await fetchJson<{
      mail_list?: TempMailPlusListItem[];
      mails?: TempMailPlusListItem[];
    } | TempMailPlusListItem[]>(
      proxyUrl(`/mails/?email=${encodeURIComponent(account.address)}&limit=25&epin=`)
    );

    const list = Array.isArray(res) ? res : res?.mail_list || res?.mails || [];
    return list.map((msg) => {
      const parsed = parseSender(msg.from_mail || msg.from);
      const fromName = msg.from_name || parsed.name || 'Unknown';
      const fromAddress = msg.from_mail || parsed.address || '';
      const textBody = msg.text || '';

      return {
        id: String(msg.mail_id ?? msg.id ?? ''),
        fromName,
        fromAddress,
        subject: msg.subject || '(No subject)',
        preview: textBody.slice(0, 120),
        receivedAt: safeIsoDate(msg.time ?? msg.date),
        hasAttachments: Array.isArray(msg.attachments) && msg.attachments.length > 0,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('tempmail.plus');
    if (!account?.address) {
      throw new ProviderHttpError('No active TempMail.Plus inbox configured.', 401, 'unauthorized');
    }

    const msg = await fetchJson<TempMailPlusDetailRaw>(
      proxyUrl(`/mails/${encodeURIComponent(id)}?email=${encodeURIComponent(account.address)}&epin=`)
    );

    const parsed = parseSender(msg.from_mail || msg.from);
    const fromName = msg.from_name || parsed.name || 'Unknown';
    const fromAddress = msg.from_mail || parsed.address || '';
    const htmlContent = msg.html || '';
    const textContent = msg.text || (htmlContent ? stripHtml(htmlContent) : '');
    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((att, idx) => {
          const attId = String(att.attachment_id ?? att.id ?? idx);
          return {
            id: attId,
            filename: att.filename || att.name || `attachment-${idx + 1}`,
            contentType: att.content_type || 'application/octet-stream',
            size: Number(att.size || 0),
            downloadUrl: `/mails/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}?email=${encodeURIComponent(account.address)}&epin=`,
          };
        })
      : [];

    const toAddresses = Array.isArray(msg.to)
      ? msg.to.map((item) => parseSender(item).address).filter(Boolean)
      : [account.address];

    return {
      id: String(msg.mail_id ?? msg.id ?? id),
      fromName,
      fromAddress,
      subject: msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.time ?? msg.date),
      hasAttachments: attachments.length > 0,
      toAddresses,
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments,
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const account = await readAccountStorage('tempmail.plus');
    if (!account?.address) {
      throw new ProviderHttpError('No active TempMail.Plus inbox configured.', 401, 'unauthorized');
    }

    await fetchJson(
      proxyUrl(`/mails/${encodeURIComponent(id)}?email=${encodeURIComponent(account.address)}&epin=`),
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
    await clearAccountStorage('tempmail.plus');
  },
};
