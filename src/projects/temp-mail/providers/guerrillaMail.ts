import {
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  clearGuerrillaSessionCache,
  clearProviderStorage,
  readGuerrillaSessionCache,
  readProviderStorage,
  StoredGuerrillaData,
  writeGuerrillaSessionCache,
  writeProviderStorage,
} from '../storage';
import { fetchJson } from './http';

const GUERRILLA_PROXY_URL = '/api/guerrilla';

export const GUERRILLA_DOMAINS = [
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'guerrillamail.info',
  'grr.la',
  'sharklasers.com',
  'guerrillamail.biz',
  'guerrillamail.de',
  'pokemail.net',
  'spam4.me',
];

interface GuerrillaRawMessage {
  mail_id: string | number;
  mail_from?: string;
  mail_subject?: string;
  mail_excerpt?: string;
  mail_timestamp?: number | string;
  att?: number | string;
  mail_body?: string;
}

interface GuerrillaEmailResponse {
  email_addr?: string;
  email_user?: string;
  sid_token?: string;
  simulated?: boolean;
  list?: GuerrillaRawMessage[];
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

function normalizeTimestamp(ts?: number | string): string {
  const numeric = Number(ts);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return new Date(numeric * 1000).toISOString();
  }
  return new Date().toISOString();
}

function normalizeSummary(raw: GuerrillaRawMessage): EmailSummary {
  const { fromName, fromAddress } = parseSender(raw.mail_from);
  return {
    id: String(raw.mail_id),
    fromName,
    fromAddress,
    subject: raw.mail_subject || '(No subject)',
    preview: raw.mail_excerpt || '(No content)',
    receivedAt: normalizeTimestamp(raw.mail_timestamp),
    hasAttachments: Number(raw.att || 0) > 0,
  };
}

function normalizeDetail(raw: GuerrillaRawMessage): EmailDetail {
  const summary = normalizeSummary(raw);
  const html =
    raw.mail_body || `<div>${raw.mail_excerpt || 'No content available'}</div>`;
  const text = raw.mail_body
    ? raw.mail_body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : raw.mail_excerpt || 'No content available';

  return {
    ...summary,
    toAddresses: [],
    text,
    html,
    attachments: [],
  };
}

async function getActiveSession(): Promise<StoredGuerrillaData> {
  const stored = await readProviderStorage<StoredGuerrillaData>('guerrillamail');
  if (!stored?.sid_token) {
    throw new Error('GuerrillaMail session not initialized.');
  }
  return stored;
}

export function getCachedGuerrillaSummaries(): EmailSummary[] {
  return readGuerrillaSessionCache<EmailSummary>();
}

export function setCachedGuerrillaSummaries(items: EmailSummary[]): void {
  writeGuerrillaSessionCache(items);
}

export const guerrillaMailAdapter: MailProviderAdapter = {
  id: 'guerrillamail',

  async getDomains(): Promise<string[]> {
    return GUERRILLA_DOMAINS;
  },

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredGuerrillaData>('guerrillamail');
    if (!stored?.email_addr || !stored?.sid_token) return null;
    return {
      provider: 'guerrillamail',
      address: stored.email_addr,
      token: stored.sid_token,
      emailUser: stored.email_user || stored.email_addr.split('@')[0],
    };
  },

  async createAccount(username?: string, domain?: string): Promise<TempAccount> {
    const init = await fetchJson<GuerrillaEmailResponse>(
      `${GUERRILLA_PROXY_URL}?f=get_email_address`
    );

    if (!init?.email_addr || !init?.sid_token) {
      throw new Error('Failed to initialize GuerrillaMail session.');
    }

    const sidToken = init.sid_token;
    let finalUser = init.email_user || init.email_addr.split('@')[0];
    let finalDomain = domain || init.email_addr.split('@')[1] || GUERRILLA_DOMAINS[0];

    const requestedUser = (username || '').trim();
    if (requestedUser) {
      try {
        const userRes = await fetchJson<GuerrillaEmailResponse>(
          `${GUERRILLA_PROXY_URL}?f=set_email_user&email_user=${encodeURIComponent(
            requestedUser
          )}&sid_token=${encodeURIComponent(sidToken)}`
        );
        if (userRes?.email_addr) {
          finalUser = userRes.email_addr.split('@')[0];
        }
      } catch {
        // Keep initialized user if custom alias fails
      }
    }

    if (domain) {
      try {
        const domainRes = await fetchJson<GuerrillaEmailResponse>(
          `${GUERRILLA_PROXY_URL}?f=set_email_domain&domain_name=${encodeURIComponent(
            domain
          )}&sid_token=${encodeURIComponent(sidToken)}`
        );
        if (domainRes?.email_addr) {
          finalDomain = domainRes.email_addr.split('@')[1];
        }
      } catch {
        try {
          const fallbackRes = await fetchJson<GuerrillaEmailResponse>(
            `${GUERRILLA_PROXY_URL}?f=set_domain&domain=${encodeURIComponent(
              domain
            )}&sid_token=${encodeURIComponent(sidToken)}`
          );
          if (fallbackRes?.email_addr) {
            finalDomain = fallbackRes.email_addr.split('@')[1];
          }
        } catch {
          // Keep selected domain as alias
        }
      }
    }

    const finalAddress = `${finalUser}@${finalDomain}`;
    const stored: StoredGuerrillaData = {
      email_addr: finalAddress,
      sid_token: sidToken,
      email_user: finalUser,
    };

    await writeProviderStorage('guerrillamail', stored);
    clearGuerrillaSessionCache();

    return {
      provider: 'guerrillamail',
      address: finalAddress,
      token: sidToken,
      emailUser: finalUser,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const session = await getActiveSession();
    const res = await fetchJson<GuerrillaEmailResponse>(
      `${GUERRILLA_PROXY_URL}?f=check_email&sid_token=${encodeURIComponent(
        session.sid_token
      )}&seq=0`
    );

    const incoming = Array.isArray(res?.list) ? res.list.map(normalizeSummary) : [];
    const cached = getCachedGuerrillaSummaries();
    const existingIds = new Set(cached.map((item) => item.id));
    const fresh = incoming.filter((item) => !existingIds.has(item.id));
    const merged = [...fresh, ...cached];
    setCachedGuerrillaSummaries(merged);
    return merged;
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const session = await getActiveSession();
    const res = await fetchJson<GuerrillaRawMessage>(
      `${GUERRILLA_PROXY_URL}?f=fetch_email&sid_token=${encodeURIComponent(
        session.sid_token
      )}&email_id=${encodeURIComponent(id)}`
    );
    if (!res || !res.mail_id) {
      throw new Error('GuerrillaMail message not found.');
    }
    return normalizeDetail(res);
  },

  async deleteMessage(id: string): Promise<void> {
    const cached = getCachedGuerrillaSummaries();
    setCachedGuerrillaSummaries(cached.filter((item) => item.id !== id));
  },

  async resetSession(): Promise<void> {
    const stored = await readProviderStorage<StoredGuerrillaData>('guerrillamail');
    if (stored?.sid_token) {
      try {
        await fetchJson(
          `${GUERRILLA_PROXY_URL}?f=forget_me&sid_token=${encodeURIComponent(
            stored.sid_token
          )}`
        );
      } catch {
        // Ignore forget_me errors on expired sessions
      }
    }
    await clearProviderStorage('guerrillamail');
    clearGuerrillaSessionCache();
  },
};
