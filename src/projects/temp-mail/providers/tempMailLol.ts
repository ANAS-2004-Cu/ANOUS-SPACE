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
import { fetchJson } from './http';

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

function parseSender(rawFrom?: string): { fromName: string; fromAddress: string } {
  const fromStr = String(rawFrom || 'Unknown');
  const matches = fromStr.match(/(.*)\s<(.*)>/);
  if (matches && matches.length > 2) {
    return {
      fromName: matches[1].trim() || matches[2].trim(),
      fromAddress: matches[2].trim(),
    };
  }
  return { fromName: fromStr, fromAddress: fromStr };
}

function normalizeMessage(
  item: TempMailLolRawMessage,
  idx: number,
  inboxAddress: string
): EmailDetail {
  const timestampMs = item.date
    ? item.date > 1e12
      ? item.date
      : item.date * 1000
    : Date.now();
  const receivedAt = new Date(timestampMs).toISOString();
  const { fromName, fromAddress } = parseSender(item.from);
  const bodyText = item.body || '';
  const bodyHtml =
    item.html || `<pre style="white-space:pre-wrap;color:inherit">${bodyText}</pre>`;
  const id =
    item.id ||
    `tmlol-${timestampMs}-${idx}-${fromAddress.replace(/[^a-zA-Z0-9]/g, '')}`;

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
    const cleanPrefix = (username || '').trim();
    const payload = cleanPrefix.length > 0 ? { prefix: cleanPrefix } : {};

    const data = await fetchJson<{ address?: string; token?: string }>(
      `${TEMPMAIL_LOL_PROXY}?endpoint=${encodeURIComponent('/v2/inbox/create')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

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
    const stored = await readProviderStorage<StoredTempMailLolData>('tempmail.lol');
    if (!stored?.token) {
      throw new Error('No active TempMail.lol session found.');
    }

    const rawData = await fetchJson<{ emails?: TempMailLolRawMessage[] }>(
      `${TEMPMAIL_LOL_PROXY}?endpoint=${encodeURIComponent(
        '/v2/inbox'
      )}&token=${encodeURIComponent(stored.token)}`
    );

    const incoming = Array.isArray(rawData?.emails)
      ? rawData.emails.map((item, idx) => normalizeMessage(item, idx, stored.address))
      : [];

    const existing = Array.isArray(stored.emails) ? stored.emails : [];
    const existingIds = new Set(existing.map((e) => e.id));
    const fresh = incoming.filter((e) => !existingIds.has(e.id));
    const merged = [...fresh, ...existing];

    await writeProviderStorage('tempmail.lol', {
      ...stored,
      emails: merged,
    });

    return merged.map(toSummary);
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
