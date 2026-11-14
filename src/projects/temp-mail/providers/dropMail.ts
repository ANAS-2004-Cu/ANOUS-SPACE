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
  safeIsoDate,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const DROPMAIL_CAPABILITIES: ProviderCapabilities = {
  mode: 'session',
  supportsDomainList: 'api',
  supportsCustomUsername: false,
  supportsDelete: false,
  inlineMessageBody: true,
  supportsAttachments: false,
  protocol: 'graphql',
};

const FALLBACK_DROPMAIL_DOMAINS = ['dropmail.me', '10mail.org', 'yomail.info'];

interface DropMailDomainRaw {
  id: string;
  name: string;
}

interface DropMailDomainsResponse {
  domains?: DropMailDomainRaw[];
}

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

const DOMAINS_QUERY = 'query { domains { id, name } }';

const INTRODUCE_SESSION_MUTATION =
  'mutation ($input: IntroduceSessionInput) { introduceSession(input: $input) { id, expiresAt, addresses { address } } }';

const RICH_MAILS_QUERY =
  'query ($id: ID!) { session(id: $id) { mails { id, fromAddr, toAddr, receivedAt, headerSubject, text, html } } }';

let cachedAuthToken = '';
const domainIdByName = new Map<string, string>();

async function postDropmailGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  preferredAuthToken?: string
): Promise<{ data: T; authToken: string }> {
  const tokenToSend = preferredAuthToken || cachedAuthToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (tokenToSend) {
    headers['X-Dropmail-Token'] = tokenToSend;
  }

  let response: Response;
  try {
    response = await fetch('/api/dropmail', {
      method: 'POST',
      headers,
      body: JSON.stringify(variables ? { query, variables } : { query }),
    });
  } catch {
    throw new ProviderHttpError(
      'Unable to reach DropMail.me server. Check your connection and try again.',
      0,
      'network'
    );
  }

  const nextToken = response.headers.get('X-Dropmail-Token')?.trim() || tokenToSend;
  if (nextToken) {
    cachedAuthToken = nextToken;
  }

  const rawText = await response.text();
  let parsed: { data?: T; errors?: Array<{ message?: string }>; error?: string; message?: string } | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errMessage =
      parsed?.error ||
      parsed?.message ||
      (response.status === 401 || response.status === 403
        ? 'DropMail.me session expired or unauthorized.'
        : `DropMail.me request failed with status ${response.status}`);
    throw new ProviderHttpError(
      errMessage,
      response.status,
      response.status === 401 || response.status === 403 ? 'unauthorized' : 'upstream'
    );
  }

  if (Array.isArray(parsed?.errors) && parsed.errors.length > 0 && !parsed.data) {
    throw new ProviderHttpError(
      parsed.errors[0]?.message || 'DropMail.me GraphQL query failed.',
      400,
      'upstream'
    );
  }

  if (!parsed || parsed.data === undefined) {
    throw new ProviderHttpError('Malformed GraphQL response from DropMail.me.', 502, 'upstream');
  }

  return { data: parsed.data, authToken: nextToken };
}

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

  async getDomains(): Promise<string[]> {
    try {
      const stored = await readAccountStorage('dropmail.me');
      const { data } = await postDropmailGraphQL<DropMailDomainsResponse>(
        DOMAINS_QUERY,
        undefined,
        stored?.authToken
      );

      const list = Array.isArray(data?.domains) ? data.domains : [];
      const names: string[] = [];
      for (const item of list) {
        const id = String(item?.id || '').trim();
        const name = String(item?.name || '').trim();
        if (id && name && name.includes('.')) {
          domainIdByName.set(name, id);
          names.push(name);
        }
      }
      if (names.length > 0) return names;
    } catch {
      // Fallback to well-known DropMail public domains if temporary fetch issue occurs
    }
    return FALLBACK_DROPMAIL_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('dropmail.me');
  },

  async createAccount(_username?: string, domain?: string): Promise<TempAccount> {
    const cleanDomain = (domain || '').trim();
    if (cleanDomain && !domainIdByName.has(cleanDomain)) {
      await this.getDomains!();
    }
    const domainId = cleanDomain ? domainIdByName.get(cleanDomain) : undefined;
    const stored = await readAccountStorage('dropmail.me');

    const { data, authToken } = await postDropmailGraphQL<DropMailIntroduceResponse>(
      INTRODUCE_SESSION_MUTATION,
      { input: domainId ? { withAddress: true, domainId } : { withAddress: true } },
      stored?.authToken
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

    const [emailUser, parsedDomain] = address.split('@');
    const account: TempAccount = {
      provider: 'dropmail.me',
      address,
      token: sessionId,
      authToken: authToken || undefined,
      accountId: sessionId,
      emailUser: emailUser || address,
      domain: parsedDomain || cleanDomain || '',
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

    let result: { data: DropMailSessionMailsResponse; authToken: string };
    try {
      result = await postDropmailGraphQL<DropMailSessionMailsResponse>(
        RICH_MAILS_QUERY,
        { id: sessionId },
        account.authToken
      );
    } catch {
      const minimalQuery = `query { session(id: ${JSON.stringify(sessionId)}) { mails { id, text, headerSubject } } }`;
      result = await postDropmailGraphQL<DropMailSessionMailsResponse>(
        minimalQuery,
        undefined,
        account.authToken
      );
    }

    if (result.authToken && result.authToken !== account.authToken) {
      await writeAccountStorage({ ...account, authToken: result.authToken });
    }

    if (result.data.session === null) {
      throw new ProviderHttpError('DropMail.me session has expired.', 401, 'unauthorized');
    }

    const mails = result.data?.session?.mails || [];
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
