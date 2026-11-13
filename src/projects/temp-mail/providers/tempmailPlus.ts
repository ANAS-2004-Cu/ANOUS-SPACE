import {
  EmailAttachment,
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  readProviderStorage,
  StoredSimpleMailboxData,
  writeProviderStorage,
} from '../storage';
import {
  escapeHtml,
  fetchBlob,
  fetchJson,
  generateRandomToken,
  stripHtml,
  triggerBlobDownload,
} from './http';

const TEMPMAIL_PLUS_PROXY_URL = '/api/tempmail-plus';

export const TEMPMAIL_PLUS_DOMAINS = [
  'mailto.plus',
  'fexpost.com',
  'fexbox.org',
  'mailbox.in.ua',
  'rover.info',
  'fextemp.com',
  'any.pink',
  'merepost.com',
];

function tempMailPlusUrl(path: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${TEMPMAIL_PLUS_PROXY_URL}?path=${encodeURIComponent(safePath)}`;
}

interface TempMailPlusSummary {
  mail_id: number | string;
  from_mail?: string;
  from_name?: string;
  subject?: string;
  time?: string;
  attachment_count?: number;
  first_attachment_name?: string;
}

interface TempMailPlusListResponse {
  result?: boolean;
  mail_list?: TempMailPlusSummary[];
}

interface TempMailPlusDetailResponse {
  result?: boolean;
  mail_id?: number | string;
  from?: string;
  from_mail?: string;
  from_name?: string;
  to?: string;
  subject?: string;
  date?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    attachment_id: number | string;
    name?: string;
    size?: number;
    content_type?: string;
  }>;
}

function normalizeDateString(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString();
  const normalized = rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  const fallback = new Date(rawDate);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }
  return rawDate;
}

async function getActiveAccount(): Promise<StoredSimpleMailboxData> {
  const stored = await readProviderStorage<StoredSimpleMailboxData>('tempmail.plus');
  if (!stored?.email) {
    throw new Error('No active TempMail.Plus mailbox found.');
  }
  return stored;
}

export const tempmailPlusAdapter: MailProviderAdapter = {
  id: 'tempmail.plus',

  async getDomains(): Promise<string[]> {
    return TEMPMAIL_PLUS_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredSimpleMailboxData>('tempmail.plus');
    if (!stored?.email) return null;
    return {
      provider: 'tempmail.plus',
      address: stored.email,
      mailbox: stored.email.split('@')[0],
    };
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser =
      (username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      generateRandomToken(10);
    const chosenDomain = domain || TEMPMAIL_PLUS_DOMAINS[0];
    const email = `${cleanUser}@${chosenDomain}`;

    await fetchJson<TempMailPlusListResponse>(
      tempMailPlusUrl(`/mails?email=${encodeURIComponent(email)}&limit=1&epin=`)
    );

    const stored: StoredSimpleMailboxData = {
      email,
      domain: chosenDomain,
    };
    await writeProviderStorage('tempmail.plus', stored);

    return {
      provider: 'tempmail.plus',
      address: email,
      mailbox: cleanUser,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const stored = await getActiveAccount();
    const res = await fetchJson<TempMailPlusListResponse>(
      tempMailPlusUrl(
        `/mails?email=${encodeURIComponent(stored.email)}&limit=20&epin=`
      )
    );
    const list = Array.isArray(res?.mail_list) ? res.mail_list : [];

    return list.map((item) => ({
      id: String(item.mail_id),
      fromName: item.from_name || item.from_mail || 'Unknown',
      fromAddress: item.from_mail || '',
      subject: item.subject || '(No subject)',
      preview: item.first_attachment_name
        ? `Attachment: ${item.first_attachment_name}`
        : `From ${item.from_name || item.from_mail || 'sender'}`,
      receivedAt: normalizeDateString(item.time),
      hasAttachments: Number(item.attachment_count || 0) > 0,
    }));
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const stored = await getActiveAccount();
    const msg = await fetchJson<TempMailPlusDetailResponse>(
      tempMailPlusUrl(
        `/mails/${encodeURIComponent(id)}?email=${encodeURIComponent(stored.email)}&epin=`
      )
    );
    if (!msg || msg.result === false || !msg.mail_id) {
      throw new Error('TempMail.Plus message not found.');
    }

    const plainBody = msg.text || (msg.html ? stripHtml(msg.html) : '');
    const htmlBody =
      msg.html ||
      `<pre style="white-space:pre-wrap;color:inherit">${escapeHtml(plainBody)}</pre>`;

    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((att) => ({
          id: String(att.attachment_id),
          filename: att.name || 'attachment',
          contentType: att.content_type || 'application/octet-stream',
          size: att.size || 0,
          downloadUrl: `/mails/${encodeURIComponent(id)}/attachments/${encodeURIComponent(
            String(att.attachment_id)
          )}?email=${encodeURIComponent(stored.email)}&epin=`,
        }))
      : [];

    return {
      id: String(msg.mail_id),
      fromName: msg.from_name || msg.from_mail || msg.from || 'Unknown',
      fromAddress: msg.from_mail || msg.from || '',
      toAddresses: [msg.to || stored.email],
      subject: msg.subject || '(No subject)',
      preview: (plainBody || '').slice(0, 120) || '(No content)',
      receivedAt: normalizeDateString(msg.date),
      hasAttachments: attachments.length > 0,
      text: plainBody || 'No content available',
      html: htmlBody,
      attachments,
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const stored = await getActiveAccount();
    await fetchJson(
      tempMailPlusUrl(
        `/mails/${encodeURIComponent(id)}?email=${encodeURIComponent(stored.email)}&epin=`
      ),
      { method: 'DELETE' }
    );
  },

  async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
    const blob = await fetchBlob(tempMailPlusUrl(downloadUrl));
    triggerBlobDownload(blob, filename || 'attachment');
  },
};
