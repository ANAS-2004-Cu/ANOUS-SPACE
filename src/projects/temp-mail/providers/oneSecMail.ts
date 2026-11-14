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

const ONESECMAIL_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'api',
  supportsCustomUsername: true,
  supportsDelete: false,
  inlineMessageBody: false,
  supportsAttachments: true,
  protocol: 'query',
};

const FALLBACK_1SECMAIL_DOMAINS = [
  '1secmail.com',
  '1secmail.org',
  '1secmail.net',
];

interface OneSecMailSummaryRaw {
  id: number | string;
  from?: string;
  subject?: string;
  date?: string;
}

interface OneSecMailDetailRaw extends OneSecMailSummaryRaw {
  attachments?: Array<{
    filename?: string;
    contentType?: string;
    size?: number;
  }>;
  body?: string;
  textBody?: string;
  htmlBody?: string;
}

function splitLoginAndDomain(account: TempAccount): { login: string; domain: string } {
  const [rawUser, rawDomain] = account.address.split('@');
  return {
    login: account.emailUser || rawUser || '',
    domain: account.domain || rawDomain || '1secmail.com',
  };
}

export const oneSecMailAdapter: MailProviderAdapter = {
  id: '1secmail',
  capabilities: ONESECMAIL_CAPABILITIES,

  async getDomains(): Promise<string[]> {
    try {
      const list = await fetchJson<string[]>('/api/onesecmail?action=getDomainList');
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((d) => typeof d === 'string' && d.includes('.'));
      }
    } catch {
      // Fallback to canonical 1secmail domains if upstream rate-limits
    }
    return FALLBACK_1SECMAIL_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('1secmail');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    let targetDomain = (domain || '').trim();
    if (!targetDomain) {
      const domains = await this.getDomains!();
      targetDomain = domains[0] || '1secmail.com';
    }

    const account: TempAccount = {
      provider: '1secmail',
      address: `${cleanUser}@${targetDomain}`,
      emailUser: cleanUser,
      mailbox: cleanUser,
      domain: targetDomain,
    };
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('1secmail');
    if (!account?.address) {
      throw new ProviderHttpError('No active 1secmail address configured.', 401, 'unauthorized');
    }

    const { login, domain } = splitLoginAndDomain(account);
    const data = await fetchJson<OneSecMailSummaryRaw[]>(
      `/api/onesecmail?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`
    );

    if (!Array.isArray(data)) return [];

    return data.map((msg) => {
      const sender = parseSender(msg.from);
      return {
        id: String(msg.id),
        fromName: sender.name,
        fromAddress: sender.address,
        subject: msg.subject || '(No subject)',
        preview: '',
        receivedAt: safeIsoDate(msg.date),
        hasAttachments: false,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('1secmail');
    if (!account?.address) {
      throw new ProviderHttpError('No active 1secmail address configured.', 401, 'unauthorized');
    }

    const { login, domain } = splitLoginAndDomain(account);
    const msg = await fetchJson<OneSecMailDetailRaw>(
      `/api/onesecmail?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(id)}`
    );

    const sender = parseSender(msg.from);
    const htmlContent = msg.htmlBody || '';
    const textContent = msg.textBody || msg.body || (htmlContent ? stripHtml(htmlContent) : '');
    const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
      ? msg.attachments.map((att, idx) => {
          const filename = att.filename || `attachment-${idx + 1}`;
          return {
            id: `${id}-${idx}-${filename}`,
            filename,
            contentType: att.contentType || 'application/octet-stream',
            size: Number(att.size || 0),
            downloadUrl: `/api/onesecmail?action=download&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(id)}&file=${encodeURIComponent(filename)}`,
          };
        })
      : [];

    return {
      id: String(msg.id || id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.date),
      hasAttachments: attachments.length > 0,
      toAddresses: [account.address],
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments,
    };
  },

  async deleteMessage(): Promise<void> {
    throw new ProviderHttpError(
      '1secmail automatically expires messages and does not support manual deletion.',
      405,
      'upstream'
    );
  },

  async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
    if (!downloadUrl) {
      throw new ProviderHttpError('Attachment download URL is missing.', 400, 'upstream');
    }
    const blob = await fetchBinary(downloadUrl);
    triggerBlobDownload(blob, filename || 'attachment');
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('1secmail');
  },
};
