import {
  clearAccountStorage,
  readAccountStorage,
  readMessageCache,
  writeAccountStorage,
  writeMessageCache,
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
  parseSender,
  safeIsoDate,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const TEMPMAIL_LOL_CAPABILITIES: ProviderCapabilities = {
  mode: 'token',
  supportsDomainList: 'auto',
  supportsCustomUsername: false,
  supportsDelete: false,
  inlineMessageBody: true,
  supportsAttachments: false,
  protocol: 'rest',
};

const proxyUrl = (path: string) => `/api/tempmail-lol?path=${encodeURIComponent(path)}`;

interface TempMailLolCreateResponse {
  address?: string;
  email?: string;
  token?: string;
}

interface TempMailLolEmailRaw {
  id?: string | number;
  _id?: string;
  from?: unknown;
  to?: unknown;
  subject?: string;
  body?: string;
  text?: string;
  html?: string;
  date?: string | number;
  createdAt?: string | number;
  created_at?: string | number;
}

function mapLolDetail(raw: TempMailLolEmailRaw, fallbackTo: string, index: number): EmailDetail {
  const sender = parseSender(raw.from);
  const htmlContent = raw.html || '';
  const textContent = raw.text || raw.body || (htmlContent ? stripHtml(htmlContent) : '');
  const id = String(raw.id ?? raw._id ?? `${raw.createdAt ?? raw.date ?? index}-${index}`);
  const toAddresses = Array.isArray(raw.to)
    ? raw.to.map((item) => parseSender(item).address).filter(Boolean)
    : typeof raw.to === 'string' && raw.to
      ? [raw.to]
      : fallbackTo
        ? [fallbackTo]
        : [];

  return {
    id,
    fromName: sender.name,
    fromAddress: sender.address,
    subject: raw.subject || '(No subject)',
    preview: (textContent || stripHtml(htmlContent)).slice(0, 120),
    receivedAt: safeIsoDate(raw.createdAt ?? raw.created_at ?? raw.date),
    hasAttachments: false,
    toAddresses,
    text: textContent || '(No content available)',
    html: htmlContent || wrapPlainTextAsHtml(textContent),
    attachments: [],
  };
}

export const tempMailLolAdapter: MailProviderAdapter = {
  id: 'tempmail.lol',
  capabilities: TEMPMAIL_LOL_CAPABILITIES,

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('tempmail.lol');
  },

  async createAccount(): Promise<TempAccount> {
    const res = await fetchJson<TempMailLolCreateResponse>(proxyUrl('/v3/inboxes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const address = String(res?.address || res?.email || '').trim();
    const token = String(res?.token || '').trim();

    if (!address || !token) {
      throw new ProviderHttpError(
        'Tempmail.lol did not return an inbox address and token.',
        502,
        'upstream'
      );
    }

    const [emailUser, domain] = address.split('@');
    const account: TempAccount = {
      provider: 'tempmail.lol',
      address,
      token,
      emailUser: emailUser || address,
      domain: domain || '',
    };

    await clearAccountStorage('tempmail.lol');
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('tempmail.lol');
    if (!account?.token) {
      throw new ProviderHttpError('No active Tempmail.lol inbox token.', 401, 'unauthorized');
    }

    const res = await fetchJson<{ emails?: TempMailLolEmailRaw[] } | TempMailLolEmailRaw[]>(
      proxyUrl(`/v3/inboxes/${encodeURIComponent(account.token)}/emails`)
    );

    const rawEmails = Array.isArray(res) ? res : res?.emails || [];
    const details = rawEmails.map((raw, idx) => mapLolDetail(raw, account.address, idx));
    writeMessageCache('tempmail.lol', details);

    return details.map(({ toAddresses: _to, text: _text, html: _html, attachments: _att, ...summary }) => summary);
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const cached = readMessageCache('tempmail.lol');
    const match = cached.find((item) => item.id === id);
    if (match) return match;

    await this.fetchMessages();
    const refreshed = readMessageCache('tempmail.lol');
    const afterSync = refreshed.find((item) => item.id === id);
    if (afterSync) return afterSync;

    throw new ProviderHttpError('Message no longer exists in this inbox.', 404, 'upstream');
  },

  async deleteMessage(): Promise<void> {
    throw new ProviderHttpError(
      'Tempmail.lol inboxes expire automatically and do not support deleting individual messages.',
      405,
      'upstream'
    );
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('tempmail.lol');
  },
};
