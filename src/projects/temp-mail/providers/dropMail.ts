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
  parseSender,
  postGraphQL,
  safeIsoDate,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const DROPMAIL_CAPABILITIES: ProviderCapabilities = {
  mode: 'session',
  supportsDomainList: 'auto',
  supportsCustomUsername: false,
  supportsDelete: false,
  inlineMessageBody: true,
  supportsAttachments: false,
  protocol: 'graphql',
};

interface DropMailIntroduceResponse {
  introduceSession?: {
    id?: string;
    expiresAt?: string;
    addresses?: Array<{ address?: string }>;
  };
}

interface DropMailMailRaw {
  id?: string;
  fromAddr?: string;
  toAddr?: string;
  receivedAt?: string;
  headerSubject?: string;
  text?: string;
  html?: string;
}

interface DropMailSessionMailsResponse {
  session?: {
    mails?: DropMailMailRaw[];
  } | null;
}

const INTRODUCE_SESSION_MUTATION =
  'mutation { introduceSession { id, expiresAt, addresses { address } } }';

const RICH_MAILS_QUERY =
  'query ($id: ID!) { session(id: $id) { mails { id, fromAddr, toAddr, receivedAt, headerSubject, text, html } } }';

function mapDropMailDetail(raw: DropMailMailRaw, fallbackTo: string, idx: number): EmailDetail {
  const sender = parseSender(raw.fromAddr);
  const htmlContent = raw.html || '';
  const textContent = raw.text || (htmlContent ? stripHtml(htmlContent) : '');
  return {
    id: String(raw.id || `dropmail-${idx}`),
    fromName: sender.name,
    fromAddress: sender.address,
    subject: raw.headerSubject || '(No subject)',
    preview: (textContent || stripHtml(htmlContent)).slice(0, 120),
    receivedAt: safeIsoDate(raw.receivedAt),
    hasAttachments: false,
    toAddresses: raw.toAddr ? [raw.toAddr] : fallbackTo ? [fallbackTo] : [],
    text: textContent || '(No content available)',
    html: htmlContent || wrapPlainTextAsHtml(textContent),
    attachments: [],
  };
}

export const dropMailAdapter: MailProviderAdapter = {
  id: 'dropmail.me',
  capabilities: DROPMAIL_CAPABILITIES,

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('dropmail.me');
  },

  async createAccount(): Promise<TempAccount> {
    const data = await postGraphQL<DropMailIntroduceResponse>(
      '/api/dropmail',
      INTRODUCE_SESSION_MUTATION
    );

    const sessionId = String(data?.introduceSession?.id || '').trim();
    const address = String(data?.introduceSession?.addresses?.[0]?.address || '').trim();
    if (!sessionId || !address) {
      throw new ProviderHttpError(
        'DropMail.me did not return a session ID and email address.',
        502,
        'upstream'
      );
    }

    const [emailUser, domain] = address.split('@');
    const account: TempAccount = {
      provider: 'dropmail.me',
      address,
      token: sessionId,
      accountId: sessionId,
      emailUser: emailUser || address,
      domain: domain || '',
      expiresAt: data.introduceSession?.expiresAt,
    };

    await clearAccountStorage('dropmail.me');
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('dropmail.me');
    const sessionId = account?.token || account?.accountId;
    if (!account?.address || !sessionId) {
      throw new ProviderHttpError('No active DropMail.me session found.', 401, 'unauthorized');
    }

    let data: DropMailSessionMailsResponse;
    try {
      data = await postGraphQL<DropMailSessionMailsResponse>('/api/dropmail', RICH_MAILS_QUERY, {
        id: sessionId,
      });
    } catch {
      const minimalQuery = `query { session(id: ${JSON.stringify(sessionId)}) { mails { id, text, headerSubject } } }`;
      data = await postGraphQL<DropMailSessionMailsResponse>('/api/dropmail', minimalQuery);
    }

    if (data.session === null) {
      throw new ProviderHttpError('DropMail.me session has expired.', 401, 'unauthorized');
    }

    const mails = data?.session?.mails || [];
    const details = mails.map((mail, idx) => mapDropMailDetail(mail, account.address, idx));
    writeMessageCache('dropmail.me', details);

    return details.map(({ toAddresses: _to, text: _text, html: _html, attachments: _att, ...summary }) => summary);
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const cached = readMessageCache('dropmail.me');
    const match = cached.find((item) => item.id === id);
    if (match) return match;

    await this.fetchMessages();
    const refreshed = readMessageCache('dropmail.me');
    const afterSync = refreshed.find((item) => item.id === id);
    if (afterSync) return afterSync;

    throw new ProviderHttpError('Message no longer exists in this session.', 404, 'upstream');
  },

  async deleteMessage(): Promise<void> {
    throw new ProviderHttpError(
      'DropMail.me clears all messages when the session expires and does not support individual deletion.',
      405,
      'upstream'
    );
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('dropmail.me');
  },
};
