import {
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  readProviderStorage,
  StoredTempMailLolData,
  writeProviderStorage,
} from '../storage';
import { escapeHtml, fetchJson, parseSender, stripHtml } from './http';

const TEMPMAIL_LOL_PROXY = '/api/tempmail-lol';

interface TempMailLolRawMessage {
  id?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  html?: string;
  date?: number;
}

interface TempMailLolPollResponse {
  emails?: TempMailLolRawMessage[];
  expired?: boolean;
}

const inFlightFetchByToken = new Map<string, Promise<EmailSummary[]>>();

function computeDeterministicId(item: TempMailLolRawMessage, timestampMs: number): string {
  const seed = `${item.from || ''}|${item.to || ''}|${item.subject || ''}|${timestampMs}|${(item.body || item.html || '').slice(0, 96)}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `tmlol-${timestampMs}-${(hash >>> 0).toString(36)}`;
}

function normalizeMessage(
  item: TempMailLolRawMessage,
  inboxAddress: string
): EmailDetail {
  const timestampMs = item.date
    ? item.date > 1e12
      ? item.date
      : item.date * 1000
    : Date.now();
  const receivedAt = new Date(timestampMs).toISOString();
  const { fromName, fromAddress } = parseSender(item.from);
  const rawHtml = item.html || '';
  const bodyText = item.body || (rawHtml ? stripHtml(rawHtml) : '');
  const bodyHtml =
    rawHtml || `<pre style="white-space:pre-wrap;color:inherit">${escapeHtml(bodyText)}</pre>`;
  const id = item.id || computeDeterministicId(item, timestampMs);

  return {
    id,
    fromName,
    fromAddress,
    toAddresses: [item.to || inboxAddress],
    subject: item.subject || '(No subject)',
    preview: bodyText.slice(0, 120) || '(No content)',
    receivedAt,
    hasAttachments: false,
    text: bodyText || 'No content available',
    html: bodyHtml,
    attachments: [],
  };
}

function toSummary(detail: EmailDetail): EmailSummary {
  return {
    id: detail.id,
    fromName: detail.fromName,
    fromAddress: detail.fromAddress,
    subject: detail.subject,
    preview: detail.preview,
    receivedAt: detail.receivedAt,
    hasAttachments: detail.hasAttachments,
  };
}

export const tempMailLolAdapter: MailProviderAdapter = {
  id: 'tempmail.lol',

  async getStoredAccount(): Promise<TempAccount | null> {
    const stored = await readProviderStorage<StoredTempMailLolData>('tempmail.lol');
    if (!stored?.address || !stored?.token) return null;
    return {
      provider: 'tempmail.lol',
      address: stored.address,
      token: stored.token,
    };
  },

  async createAccount(username?: string): Promise<TempAccount> {
    const cleanPrefix = (username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 32);
    const payload = cleanPrefix.length > 0 ? { prefix: cleanPrefix } : {};

    let data: { address?: string; token?: string };
    try {
      data = await fetchJson<{ address?: string; token?: string }>(
        `${TEMPMAIL_LOL_PROXY}?endpoint=${encodeURIComponent('/v2/inbox/create')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
    } catch {
      if (!cleanPrefix) {
        throw new Error('Failed to create TempMail.lol address.');
      }
      data = await fetchJson<{ address?: string; token?: string }>(
        `${TEMPMAIL_LOL_PROXY}?endpoint=${encodeURIComponent('/v2/inbox/create')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }
      );
    }

    if (!data?.address || !data?.token) {
      throw new Error('Failed to create TempMail.lol address.');
    }

    const stored: StoredTempMailLolData = {
      address: data.address,
      token: data.token,
      emails: [],
    };
    await writeProviderStorage('tempmail.lol', stored);

    return {
      provider: 'tempmail.lol',
      address: data.address,
      token: data.token,
    };
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const initialStored = await readProviderStorage<StoredTempMailLolData>('tempmail.lol');
    if (!initialStored?.token) {
      throw new Error('No active TempMail.lol session found.');
    }

    const activeToken = initialStored.token;
    const existingPromise = inFlightFetchByToken.get(activeToken);
    if (existingPromise) {
      return existingPromise;
    }

    const requestPromise = (async () => {
      try {
        const rawData = await fetchJson<TempMailLolPollResponse>(
          `${TEMPMAIL_LOL_PROXY}?endpoint=${encodeURIComponent(
            '/v2/inbox'
          )}&token=${encodeURIComponent(activeToken)}`
        );

        if (rawData?.expired === true) {
          throw new Error(
            'This TempMail.lol address has expired. Create a new address to receive mail.'
          );
        }

        const latestStored =
          (await readProviderStorage<StoredTempMailLolData>('tempmail.lol')) ||
          initialStored;

        if (latestStored.token !== activeToken) {
          return (latestStored.emails || []).map(toSummary);
        }

        const incoming = Array.isArray(rawData?.emails)
          ? rawData.emails.map((item) => normalizeMessage(item, latestStored.address))
          : [];

        const existing = Array.isArray(latestStored.emails) ? latestStored.emails : [];
        const existingIds = new Set(existing.map((e) => e.id));
        const fresh = incoming.filter((e) => !existingIds.has(e.id));
        const merged = [...fresh, ...existing];

        await writeProviderStorage('tempmail.lol', {
          ...latestStored,
          emails: merged,
        });

        return merged.map(toSummary);
      } finally {
        inFlightFetchByToken.delete(activeToken);
      }
    })();

    inFlightFetchByToken.set(activeToken, requestPromise);
    return requestPromise;
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const stored = await readProviderStorage<StoredTempMailLolData>('tempmail.lol');
    const found = stored?.emails?.find((e) => e.id === id);
    if (!found) {
      throw new Error('TempMail.lol message not found.');
    }
    return found;
  },

  async deleteMessage(id: string): Promise<void> {
    const stored = await readProviderStorage<StoredTempMailLolData>('tempmail.lol');
    if (!stored) return;
    await writeProviderStorage('tempmail.lol', {
      ...stored,
      emails: (stored.emails || []).filter((e) => e.id !== id),
    });
  },
};
