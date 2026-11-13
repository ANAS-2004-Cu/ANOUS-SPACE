import {
  EmailAttachment,
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  TempAccount,
} from '../types';
import {
  readProviderStorage,
  StoredMailTmData,
  writeProviderStorage,
} from '../storage';
import {
  escapeHtml,
  fetchBlob,
  fetchJson,
  generateRandomToken,
  ProviderHttpError,
  triggerBlobDownload,
} from './http';

interface HydraDomainMember {
  domain?: string;
  isActive?: boolean;
}

interface HydraRawMessage {
  id: string;
  from?: { address?: string; name?: string };
  to?: Array<{ address?: string; name?: string }>;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string | string[];
  createdAt?: string;
  hasAttachments?: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
  }>;
}

export interface HydraProviderConfig {
  id: 'mail.tm' | 'mail.gw';
  label: string;
  proxyUrl: string;
  upstreamOrigin: string;
  fallbackDomains: string[];
}

export function createHydraMailAdapter(config: HydraProviderConfig): MailProviderAdapter {
  function buildProxyUrl(path: string): string {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return `${config.proxyUrl}?path=${encodeURIComponent(safePath)}`;
  }

  async function refreshStoredToken(stored: StoredMailTmData): Promise<string | null> {
    if (!stored.email || !stored.password) return null;
    try {
      const auth = await fetchJson<{ token?: string; id?: string }>(
        buildProxyUrl('/token'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: stored.email,
            password: stored.password,
          }),
        }
      );
      if (!auth?.token) return null;
      await writeProviderStorage<StoredMailTmData>(config.id, {
        ...stored,
        token: auth.token,
        id: auth.id || stored.id,
      });
      return auth.token;
    } catch {
      return null;
    }
  }

  async function withAuthRetry<T>(
    execute: (token: string) => Promise<T>
  ): Promise<T> {
    const stored = await readProviderStorage<StoredMailTmData>(config.id);
    if (!stored?.token) {
      throw new Error(`No active ${config.label} session found.`);
    }

    try {
      return await execute(stored.token);
    } catch (err) {
      if (err instanceof ProviderHttpError && err.status === 401) {
        const refreshed = await refreshStoredToken(stored);
        if (refreshed) {
          return await execute(refreshed);
        }
      }
      throw err;
    }
  }

  function normalizeSummary(raw: HydraRawMessage): EmailSummary {
    return {
      id: raw.id,
      fromName: raw.from?.name || raw.from?.address || 'Unknown',
      fromAddress: raw.from?.address || '',
      subject: raw.subject || '(No subject)',
      preview: raw.intro || '(No content)',
      receivedAt: raw.createdAt || new Date().toISOString(),
      hasAttachments: Boolean(raw.hasAttachments),
    };
  }

  function normalizeDetail(raw: HydraRawMessage): EmailDetail {
    const rawHtml = Array.isArray(raw.html) ? raw.html.join('\n') : raw.html;
    const text = raw.text || 'No content available';
    const html =
      rawHtml || `<pre style="white-space:pre-wrap;color:inherit">${escapeHtml(text)}</pre>`;

    const attachments: EmailAttachment[] = Array.isArray(raw.attachments)
      ? raw.attachments.map((att) => ({
          id: att.id,
          filename: att.filename || 'attachment',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          downloadUrl: att.downloadUrl,
        }))
      : [];

    return {
      ...normalizeSummary(raw),
      toAddresses: Array.isArray(raw.to)
        ? raw.to.map((r) => r.address || '').filter(Boolean)
        : [],
      text,
      html,
      attachments,
    };
  }

  return {
    id: config.id,

    async getDomains(): Promise<string[]> {
      try {
        const data = await fetchJson<
          HydraDomainMember[] | { 'hydra:member'?: HydraDomainMember[] }
        >(buildProxyUrl('/domains'));
        const members = Array.isArray(data) ? data : data?.['hydra:member'];
        if (Array.isArray(members)) {
          const domains = members
            .filter((item) => item.isActive !== false)
            .map((item) => item.domain)
            .filter((d): d is string => Boolean(d));
          if (domains.length > 0) return domains;
        }
      } catch {
        // Fallback below
      }
      return config.fallbackDomains;
    },

    async getStoredAccount(): Promise<TempAccount | null> {
      const stored = await readProviderStorage<StoredMailTmData>(config.id);
      if (!stored?.email || !stored?.token) return null;
      return {
        provider: config.id,
        address: stored.email,
        token: stored.token,
        password: stored.password,
        accountId: stored.id,
      };
    },

    async createAccount(username?: string, domain?: string): Promise<TempAccount> {
      const cleanUser =
        (username || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9._-]/g, '') || generateRandomToken(10);
      const chosenDomain =
        domain || (await this.getDomains!())[0] || config.fallbackDomains[0];
      const address = `${cleanUser}@${chosenDomain}`;
      const password = generateRandomToken(14);

      await fetchJson(buildProxyUrl('/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });

      const auth = await fetchJson<{ token: string; id: string }>(
        buildProxyUrl('/token'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, password }),
        }
      );

      if (!auth?.token) {
        throw new Error(`Failed to authenticate ${config.label} account.`);
      }

      const stored: StoredMailTmData = {
        email: address,
        password,
        token: auth.token,
        id: auth.id,
      };
      await writeProviderStorage(config.id, stored);

      return {
        provider: config.id,
        address,
        password,
        token: auth.token,
        accountId: auth.id,
      };
    },

    async fetchMessages(): Promise<EmailSummary[]> {
      const data = await withAuthRetry((token) =>
        fetchJson<HydraRawMessage[] | { 'hydra:member'?: HydraRawMessage[] }>(
          buildProxyUrl('/messages?page=1'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      );

      const list = Array.isArray(data) ? data : data?.['hydra:member'] || [];
      return list.map(normalizeSummary);
    },

    async fetchMessageDetail(id: string): Promise<EmailDetail> {
      const data = await withAuthRetry((token) =>
        fetchJson<HydraRawMessage>(buildProxyUrl(`/messages/${encodeURIComponent(id)}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return normalizeDetail(data);
    },

    async deleteMessage(id: string): Promise<void> {
      await withAuthRetry((token) =>
        fetchJson(buildProxyUrl(`/messages/${encodeURIComponent(id)}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );
    },

    async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
      const relativePath = downloadUrl.startsWith(config.upstreamOrigin)
        ? downloadUrl.replace(config.upstreamOrigin, '')
        : downloadUrl;

      const blob = await withAuthRetry((token) =>
        fetchBlob(buildProxyUrl(relativePath), {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      triggerBlobDownload(blob, filename || 'attachment');
    },
  };
}
