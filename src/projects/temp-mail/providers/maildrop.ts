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
  generateRandomUsername,
  parseSender,
  postGraphQL,
  safeIsoDate,
  sanitizeUsername,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const MAILDROP_CAPABILITIES: ProviderCapabilities = {
  mode: 'stateless',
  supportsDomainList: 'fixed',
  fixedDomains: ['maildrop.cc'],
  supportsCustomUsername: true,
  supportsDelete: true,
  inlineMessageBody: false,
  supportsAttachments: false,
  protocol: 'graphql',
};

interface MaildropMessageSummaryRaw {
  id: string;
  headerfrom?: string;
  subject?: string;
  date?: string;
}

interface MaildropMessageDetailRaw extends MaildropMessageSummaryRaw {
  data?: string;
  html?: string;
}

function resolveMailbox(account: TempAccount): string {
  return account.mailbox || account.emailUser || account.address.split('@')[0] || '';
}

export const maildropAdapter: MailProviderAdapter = {
  id: 'maildrop.cc',
  capabilities: MAILDROP_CAPABILITIES,

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('maildrop.cc');
  },

  async createAccount(username?: string): Promise<TempAccount> {
    const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
    const account: TempAccount = {
      provider: 'maildrop.cc',
      address: `${cleanUser}@maildrop.cc`,
      mailbox: cleanUser,
      emailUser: cleanUser,
      domain: 'maildrop.cc',
    };
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('maildrop.cc');
    if (!account?.address) {
      throw new ProviderHttpError('No active Maildrop.cc mailbox configured.', 401, 'unauthorized');
    }

    const mailbox = resolveMailbox(account);
    let list: MaildropMessageSummaryRaw[] = [];
    try {
      const data = await postGraphQL<{ inbox?: MaildropMessageSummaryRaw[] }>(
        '/api/maildrop',
        'query ($mailbox: String!) { inbox(mailbox: $mailbox) { id headerfrom subject date } }',
        { mailbox }
      );
      list = data?.inbox || [];
    } catch {
      const fallbackData = await postGraphQL<{ inbox?: MaildropMessageSummaryRaw[] }>(
        '/api/maildrop',
        `query { inbox(mailbox: ${JSON.stringify(mailbox)}) { id subject } }`
      );
      list = fallbackData?.inbox || [];
    }

    return list.map((msg) => {
      const sender = parseSender(msg.headerfrom);
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
    const account = await readAccountStorage('maildrop.cc');
    if (!account?.address) {
      throw new ProviderHttpError('No active Maildrop.cc mailbox configured.', 401, 'unauthorized');
    }

    const mailbox = resolveMailbox(account);
    const data = await postGraphQL<{ message?: MaildropMessageDetailRaw | null }>(
      '/api/maildrop',
      'query ($mailbox: String!, $id: String!) { message(mailbox: $mailbox, id: $id) { id headerfrom subject date data html } }',
      { mailbox, id }
    );

    const msg = data?.message;
    if (!msg) {
      throw new ProviderHttpError('Message not found in Maildrop.cc inbox.', 404, 'upstream');
    }

    const sender = parseSender(msg.headerfrom);
    const htmlContent = msg.html || '';
    const textContent = msg.data || (htmlContent ? stripHtml(htmlContent) : '');

    return {
      id: String(msg.id || id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.subject || '(No subject)',
      preview: textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.date),
      hasAttachments: false,
      toAddresses: [account.address],
      text: textContent || '(No content available)',
      html: htmlContent || wrapPlainTextAsHtml(textContent),
      attachments: [],
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const account = await readAccountStorage('maildrop.cc');
    if (!account?.address) {
      throw new ProviderHttpError('No active Maildrop.cc mailbox configured.', 401, 'unauthorized');
    }

    const mailbox = resolveMailbox(account);
    await postGraphQL<{ delete?: boolean }>(
      '/api/maildrop',
      'mutation ($mailbox: String!, $id: String!) { delete(mailbox: $mailbox, id: $id) }',
      { mailbox, id }
    );
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('maildrop.cc');
  },
};
