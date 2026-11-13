import {
  EmailAttachment,
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  readProviderStorage,
  StoredMailTmData,
  writeProviderStorage,
} from '../storage';
import { fetchBlob, fetchJson, generateRandomToken } from './http';

const MAILTM_PROXY_URL = '/api/mailtm';
const FALLBACK_DOMAINS = ['dollicons.com', 'mail.tm'];

function mailTmUrl(path: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${MAILTM_PROXY_URL}?path=${encodeURIComponent(safePath)}`;
}

interface MailTmDomainMember {
  domain?: string;
}

interface MailTmRawMessage {
  id: string;
  from?: { address?: string; name?: string };
  to?: Array<{ address?: string; name?: string }>;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string | string[];
  createdAt?: string;
  hasAttachments?: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
  }>;
}

async function getStoredToken(): Promise<string> {
  const stored = await readProviderStorage<StoredMailTmData>('mail.tm');
  if (!stored?.token) {
    throw new Error('No active Mail.TM session found.');
  }
  return stored.token;
}

function normalizeSummary(raw: MailTmRawMessage): EmailSummary {
  return {
    id: raw.id,
    fromName: raw.from?.name || raw.from?.address || 'Unknown',
    fromAddress: raw.from?.address || '',
    subject: raw.subject || '(No subject)',
    preview: raw.intro || '(No content)',
    receivedAt: raw.createdAt || new Date().toISOString(),
    hasAttachments: Boolean(raw.hasAttachments),
  };
}

function normalizeDetail(raw: MailTmRawMessage): EmailDetail {
  const rawHtml = Array.isArray(raw.html) ? raw.html.join('\n') : raw.html;
  const text = raw.text || 'No content available';
  const html = rawHtml || `<div>${text}</div>`;

  const attachments: EmailAttachment[] = Array.isArray(raw.attachments)
    ? raw.attachments.map((att) => ({
        id: att.id,
        filename: att.filename || 'attachment',
        contentType: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        downloadUrl: att.downloadUrl,
      }))
    : [];

  return {
    ...normalizeSummary(raw),
    toAddresses: Array.isArray(raw.to)
      ? raw.to.map((r) => r.address || '').filter(Boolean)
      : [],
    text,
    html,
    attachments,
  };
}

export const mailTmAdapter: MailProviderAdapter = {
  id: 'mail.tm',

  async getDomains(): Promise<string[]> {
    try {
      const data = await fetchJson<
        MailTmDomainMember[] | { 'hydra:member'?: MailTmDomainMember[] }
      >(mailTmUrl('/domains'));
      const members = Array.isArray(data) ? data : data?.['hydra:member'];
      if (Array.isArray(members)) {
        const domains = members
          .map((item) => item.domain)
          .filter((d): d is string => Boolean(d));
        if (domains.length > 0) return domains;
      }
    } catch {
      // Fallback below
    }
    return FALLBACK_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredMailTmData>('mail.tm');
    if (!stored?.email) return null;
    return {
      provider: 'mail.tm',
      address: stored.email,
      token: stored.token,
      password: stored.password,
      accountId: stored.id,
    };
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = (username || '').trim() || generateRandomToken(10);
    const chosenDomain = domain || (await this.getDomains!())[0] || FALLBACK_DOMAINS[0];
    const address = `${cleanUser}@${chosenDomain}`;
    const password = generateRandomToken(12);

    await fetchJson(mailTmUrl('/accounts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    const auth = await fetchJson<{ token: string; id: string }>(mailTmUrl('/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    const stored: StoredMailTmData = {
      email: address,
      password,
      token: auth.token,
      id: auth.id,
    };
    await writeProviderStorage('mail.tm', stored);

    return {
      provider: 'mail.tm',
      address,
      password,
      token: auth.token,
      accountId: auth.id,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const token = await getStoredToken();
    const data = await fetchJson<
      MailTmRawMessage[] | { 'hydra:member'?: MailTmRawMessage[] }
    >(mailTmUrl('/messages?page=1'), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const list = Array.isArray(data) ? data : data?.['hydra:member'] || [];
    return list.map(normalizeSummary);
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const token = await getStoredToken();
    const data = await fetchJson<MailTmRawMessage>(mailTmUrl(`/messages/${id}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return normalizeDetail(data);
  },

  async deleteMessage(id: string): Promise<void> {
    const token = await getStoredToken();
    await fetchJson(mailTmUrl(`/messages/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
    const token = await getStoredToken();
    const relativePath = downloadUrl.startsWith('https://api.mail.tm')
      ? downloadUrl.replace('https://api.mail.tm', '')
      : downloadUrl;

    const blob = await fetchBlob(mailTmUrl(relativePath), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename || 'attachment');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};
