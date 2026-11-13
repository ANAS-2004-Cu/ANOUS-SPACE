import {
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  readProviderStorage,
  StoredMaildropData,
  writeProviderStorage,
} from '../storage';
import { fetchJson, generateRandomToken } from './http';

const MAILDROP_PROXY_URL = '/api/maildrop';
const MAILDROP_DIRECT_URL = 'https://api.maildrop.cc/graphql';

interface GraphQLResponse<T> {
  data?: T;
}

interface MaildropRawSummary {
  id: string;
  headerfrom?: string;
  subject?: string;
  date?: string;
}

interface MaildropRawDetail extends MaildropRawSummary {
  data?: string;
  html?: string;
}

function parseSender(rawFrom?: string): { fromName: string; fromAddress: string } {
  const fromStr = String(rawFrom || 'Unknown');
  const matches = fromStr.match(/(.*)\s<(.*)>/);
  if (matches && matches.length > 2) {
    return {
      fromName: matches[1].replace(/^"|"$/g, '').trim() || matches[2].trim(),
      fromAddress: matches[2].trim(),
    };
  }
  return { fromName: fromStr, fromAddress: fromStr };
}

async function executeGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T | undefined> {
  const body = JSON.stringify({ query, variables });
  const headers = { 'Content-Type': 'application/json' };

  try {
    const proxyRes = await fetchJson<GraphQLResponse<T>>(MAILDROP_PROXY_URL, {
      method: 'POST',
      headers,
      body,
    });
    if (proxyRes?.data) return proxyRes.data;
  } catch {
    // Fallback to direct endpoint
  }

  const directRes = await fetchJson<GraphQLResponse<T>>(MAILDROP_DIRECT_URL, {
    method: 'POST',
    headers,
    body,
  });
  return directRes?.data;
}

async function getActiveMailbox(): Promise<StoredMaildropData> {
  const stored = await readProviderStorage<StoredMaildropData>('maildrop.cc');
  if (!stored?.mailbox) {
    throw new Error('No active Maildrop.cc mailbox found.');
  }
  return stored;
}

export const maildropAdapter: MailProviderAdapter = {
  id: 'maildrop.cc',

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredMaildropData>('maildrop.cc');
    if (!stored?.email) return null;
    return {
      provider: 'maildrop.cc',
      address: stored.email,
      mailbox: stored.mailbox,
    };
  },

  async createAccount(username?: string): Promise<TempAccount> {
    const cleanUser =
      (username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      generateRandomToken(10);
    const email = `${cleanUser}@maildrop.cc`;

    const stored: StoredMaildropData = {
      email,
      mailbox: cleanUser,
    };
    await writeProviderStorage('maildrop.cc', stored);

    return {
      provider: 'maildrop.cc',
      address: email,
      mailbox: cleanUser,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const stored = await getActiveMailbox();
    const query = `
      query GetInbox($mailbox: String!) {
        inbox(mailbox: $mailbox) {
          id
          headerfrom
          subject
          date
        }
      }
    `;

    const data = await executeGraphQL<{ inbox?: MaildropRawSummary[] }>(query, {
      mailbox: stored.mailbox,
    });
    const list = Array.isArray(data?.inbox) ? data.inbox : [];

    return list.map((item) => {
      const { fromName, fromAddress } = parseSender(item.headerfrom);
      return {
        id: item.id,
        fromName,
        fromAddress,
        subject: item.subject || '(No subject)',
        preview: `Received from ${fromName}`,
        receivedAt: item.date || new Date().toISOString(),
        hasAttachments: false,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const stored = await getActiveMailbox();
    const query = `
      query GetMessage($mailbox: String!, $id: String!) {
        message(mailbox: $mailbox, id: $id) {
          id
          headerfrom
          subject
          date
          data
          html
        }
      }
    `;

    const data = await executeGraphQL<{ message?: MaildropRawDetail }>(query, {
      mailbox: stored.mailbox,
      id,
    });
    const msg = data?.message;
    if (!msg) {
      throw new Error('Maildrop.cc message not found.');
    }

    const { fromName, fromAddress } = parseSender(msg.headerfrom);
    const plainBody =
      msg.data ||
      (msg.html ? msg.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');
    const htmlBody =
      msg.html || `<pre style="white-space:pre-wrap;color:inherit">${msg.data || ''}</pre>`;

    return {
      id: msg.id,
      fromName,
      fromAddress,
      toAddresses: [stored.email],
      subject: msg.subject || '(No subject)',
      preview: plainBody.slice(0, 120) || '(No content)',
      receivedAt: msg.date || new Date().toISOString(),
      hasAttachments: false,
      text: plainBody || 'No content available',
      html: htmlBody,
      attachments: [],
    };
  },

  async deleteMessage(id: string): Promise<void> {
    const stored = await getActiveMailbox();
    const query = `
      mutation DeleteMessage($mailbox: String!, $id: String!) {
        delete(mailbox: $mailbox, id: $id)
      }
    `;
    await executeGraphQL(query, { mailbox: stored.mailbox, id });
  },
};
