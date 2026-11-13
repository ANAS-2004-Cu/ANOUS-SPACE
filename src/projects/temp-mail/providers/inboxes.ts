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
  fetchJson,
  generateRandomToken,
  parseSender,
  stripHtml,
} from './http';

const INBOXES_PROXY_URL = '/api/inboxes';

const FALLBACK_DOMAINS = [
  'getnada.com',
  'blondmail.com',
  'chapsmail.com',
  'clowmail.com',
  'dropjar.com',
  'fivermail.com',
  'getairmail.com',
];

function inboxesUrl(path: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${INBOXES_PROXY_URL}?path=${encodeURIComponent(safePath)}`;
}

interface InboxesDomainResponse {
  domains?: Array<{ qdn?: string }>;
}

interface InboxesRawMessage {
  uid: string;
  f?: string;
  ff?: string;
  s?: string;
  ph?: string;
  cr?: string;
  html?: string;
  text?: string;
  at?: Array<{
    id?: string;
    name?: string;
    filename?: string;
    contentType?: string;
    size?: number;
    url?: string;
  }>;
}

interface InboxesInboxResponse {
  msgs?: InboxesRawMessage[];
}

async function getActiveAccount(): Promise<StoredSimpleMailboxData> {
  const stored = await readProviderStorage<StoredSimpleMailboxData>('inboxes.com');
  if (!stored?.email) {
    throw new Error('No active Inboxes.com mailbox found.');
  }
  return stored;
}

export const inboxesAdapter: MailProviderAdapter = {
  id: 'inboxes.com',

  async getDomains(): Promise<string[]> {
    try {
      const data = await fetchJson<InboxesDomainResponse>(inboxesUrl('/domain'));
      if (Array.isArray(data?.domains)) {
        const list = data.domains
          .map((item) => item.qdn)
          .filter((d): d is string => Boolean(d));
        if (list.length > 0) return list;
      }
    } catch {
      // Fallback below
    }
    return FALLBACK_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredSimpleMailboxData>('inboxes.com');
    if (!stored?.email) return null;
    return {
      provider: 'inboxes.com',
      address: stored.email,
      mailbox: stored.email.split('@')[0],
    };
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const cleanUser =
      (username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      generateRandomToken(10);
    const chosenDomain =
      domain || (await this.getDomains!())[0] || FALLBACK_DOMAINS[0];
    const email = `${cleanUser}@${chosenDomain}`;

    await fetchJson<InboxesInboxResponse>(
      inboxesUrl(`/inbox/${encodeURIComponent(email)}`)
    );

    const stored: StoredSimpleMailboxData = {
      email,
      domain: chosenDomain,
    };
    await writeProviderStorage('inboxes.com', stored);

    return {
      provider: 'inboxes.com',
      address: email,
      mailbox: cleanUser,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const stored = await getActiveAccount();
    const res = await fetchJson<InboxesInboxResponse>(
      inboxesUrl(`/inbox/${encodeURIComponent(stored.email)}`)
    );
    const list = Array.isArray(res?.msgs) ? res.msgs : [];

    return list.map((msg) => {
      const { fromName, fromAddress } = parseSender(msg.f);
      const previewText = (msg.ph || '').replace(/\s+/g, ' ').trim();
      return {
        id: msg.uid,
        fromName,
        fromAddress,
        subject: msg.s || '(No subject)',
        preview: previewText || '(No content)',
        receivedAt: msg.cr || new Date().toISOString(),
        hasAttachments: Array.isArray(msg.at) && msg.at.length > 0,
      };
    });
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const stored = await getActiveAccount();
    const msg = await fetchJson<InboxesRawMessage>(
      inboxesUrl(`/message/${encodeURIComponent(id)}`)
    );
    if (!msg?.uid) {
      throw new Error('Inboxes.com message not found.');
    }

    const { fromName, fromAddress } = parseSender(msg.ff || msg.f);
    const plainBody = msg.text || (msg.html ? stripHtml(msg.html) : '');
    const htmlBody =
      msg.html ||
      `<pre style="white-space:pre-wrap;color:inherit">${escapeHtml(plainBody)}</pre>`;

    const attachments: EmailAttachment[] = Array.isArray(msg.at)
      ? msg.at
          .filter((att) => Boolean(att?.url))
          .map((att, idx) => ({
            id: att.id || `att-${idx}`,
            filename: att.filename || att.name || 'attachment',
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            downloadUrl: att.url || '',
          }))
      : [];

    return {
      id: msg.uid,
      fromName,
      fromAddress,
      toAddresses: [stored.email],
      subject: msg.s || '(No subject)',
      preview: (plainBody || '').slice(0, 120) || '(No content)',
      receivedAt: msg.cr || new Date().toISOString(),
      hasAttachments: attachments.length > 0,
      text: plainBody || 'No content available',
      html: htmlBody,
      attachments,
    };
  },

  async deleteMessage(id: string): Promise<void> {
    await fetchJson(inboxesUrl(`/message/${encodeURIComponent(id)}`), {
      method: 'DELETE',
    });
  },
};
