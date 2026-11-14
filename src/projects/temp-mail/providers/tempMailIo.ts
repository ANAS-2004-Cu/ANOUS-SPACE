import {
  clearAccountStorage,
  readAccountStorage,
  readMessageCache,
  writeAccountStorage,
  writeMessageCache,
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

const TEMPMAIL_IO_CAPABILITIES: ProviderCapabilities = {
  mode: 'token',
  supportsDomainList: 'api',
  supportsCustomUsername: true,
  supportsDelete: true,
  inlineMessageBody: true,
  supportsAttachments: true,
  protocol: 'rest',
};

const FALLBACK_TEMPMAIL_IO_DOMAINS = ['bwmyga.com', 'lnovic.com', 'ruutukf.com'];

const proxyUrl = (path: string) => `/api/tempmail-io?path=${encodeURIComponent(path)}`;

interface TempMailIoDomainRaw {
  name?: string;
  type?: string;
}

interface TempMailIoAttachmentRaw {
  id?: string | number;
  name?: string;
  filename?: string;
  size?: number;
  content_type?: string;
}

interface TempMailIoMessageRaw {
  id?: string | number;
  from?: unknown;
  to?: unknown;
  cc?: unknown;
  subject?: string;
  body_text?: string;
  body_html?: string;
  created_at?: string | number;
  attachments?: TempMailIoAttachmentRaw[];
}

function mapIoDetail(raw: TempMailIoMessageRaw, fallbackTo: string, idx: number): EmailDetail {
  const sender = parseSender(raw.from);
  const htmlContent = raw.body_html || '';
  const textContent = raw.body_text || (htmlContent ? stripHtml(htmlContent) : '');
  const toAddresses = Array.isArray(raw.to)
    ? raw.to.map((item) => parseSender(item).address || String(item)).filter(Boolean)
    : typeof raw.to === 'string' && raw.to
      ? [raw.to]
      : fallbackTo
        ? [fallbackTo]
        : [];

  const attachments: EmailAttachment[] = Array.isArray(raw.attachments)
    ? raw.attachments.map((att, attIdx) => {
        const attId = String(att.id ?? attIdx);
        return {
          id: attId,
          filename: att.name || att.filename || `attachment-${attIdx + 1}`,
          contentType: att.content_type || 'application/octet-stream',
          size: Number(att.size || 0),
          downloadUrl: `/attachment/${encodeURIComponent(attId)}`,
        };
      })
    : [];

  return {
    id: String(raw.id ?? `tempmailio-${idx}`),
    fromName: sender.name,
    fromAddress: sender.address,
    subject: raw.subject || '(No subject)',
    preview: (textContent || stripHtml(htmlContent)).slice(0, 120),
    receivedAt: safeIsoDate(raw.created_at),
    hasAttachments: attachments.length > 0,
    toAddresses,
    text: textContent || '(No content available)',
    html: htmlContent || wrapPlainTextAsHtml(textContent),
    attachments,
  };
}

export const tempMailIoAdapter: MailProviderAdapter = {
  id: 'temp-mail.io',
  capabilities: TEMPMAIL_IO_CAPABILITIES,

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetchJson<{ domains?: Array<TempMailIoDomainRaw | string> }>(
        proxyUrl('/domains')
      );
      const rawList = Array.isArray(res?.domains) ? res.domains : [];
      const publicDomains = rawList
        .filter((d) => typeof d === 'string' || d?.type !== 'premium')
        .map((d) => (typeof d === 'string' ? d.trim() : String(d?.name || '').trim()))
        .filter((d) => d.includes('.'));
      if (publicDomains.length > 0) return publicDomains;
    } catch {
      // Fallback to verified public domains
    }
    return FALLBACK_TEMPMAIL_IO_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('temp-mail.io');
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    let targetDomain = (domain || '').trim();
    if (!targetDomain) {
      const domains = await this.getDomains!();
      targetDomain = domains[0] || FALLBACK_TEMPMAIL_IO_DOMAINS[0];
    }

    const res = await fetchJson<{ email?: string; token?: string }>(proxyUrl('/email/new'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanUser,
        domain: targetDomain,
      }),
    });

    const address = String(res?.email || `${cleanUser}@${targetDomain}`).trim();
    const token = String(res?.token || '').trim();

    if (!address || !token) {
      throw new ProviderHttpError(
        'Temp-Mail.io did not return an email address and token.',
        502,
        'upstream'
      );
    }

    const [parsedUser, parsedDomain] = address.split('@');
    const account: TempAccount = {
      provider: 'temp-mail.io',
      address,
      token,
      emailUser: parsedUser || cleanUser,
      domain: parsedDomain || targetDomain,
    };

    await clearAccountStorage('temp-mail.io');
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('temp-mail.io');
    if (!account?.address) {
      throw new ProviderHttpError('No active Temp-Mail.io inbox found.', 401, 'unauthorized');
    }

    const res = await fetchJson<TempMailIoMessageRaw[] | { messages?: TempMailIoMessageRaw[] }>(
      proxyUrl(`/email/${encodeURIComponent(account.address)}/messages`)
    );

    const list = Array.isArray(res) ? res : res?.messages || [];
    const details = list.map((msg, idx) => mapIoDetail(msg, account.address, idx));
    writeMessageCache('temp-mail.io', details);

    return details.map(({ toAddresses: _to, text: _text, html: _html, attachments: _att, ...summary }) => summary);
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const cached = readMessageCache('temp-mail.io');
    const match = cached.find((item) => item.id === id);
    if (match) return match;

    await this.fetchMessages();
    const refreshed = readMessageCache('temp-mail.io');
    const afterSync = refreshed.find((item) => item.id === id);
    if (afterSync) return afterSync;

    throw new ProviderHttpError('Message no longer exists in this inbox.', 404, 'upstream');
  },

  async deleteMessage(id: string): Promise<void> {
    await fetchJson(proxyUrl(`/message/${encodeURIComponent(id)}`), {
      method: 'DELETE',
    });

    const cached = readMessageCache('temp-mail.io').filter((item) => item.id !== id);
    writeMessageCache('temp-mail.io', cached);
  },

  async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
    if (!downloadUrl) {
      throw new ProviderHttpError('Attachment download URL is missing.', 400, 'upstream');
    }
    const blob = await fetchBinary(proxyUrl(downloadUrl));
    triggerBlobDownload(blob, filename || 'attachment');
  },

  async resetSession(): Promise<void> {
    const account = await readAccountStorage('temp-mail.io');
    if (account?.address && account?.token) {
      try {
        await fetchJson(proxyUrl(`/email/${encodeURIComponent(account.address)}`), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: account.token }),
        });
      } catch {
        // Always clear local session even if server deletion fails
      }
    }
    await clearAccountStorage('temp-mail.io');
  },
};
