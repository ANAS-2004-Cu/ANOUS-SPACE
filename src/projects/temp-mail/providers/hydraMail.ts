import {
  clearAccountStorage,
  readAccountStorage,
  writeAccountStorage,
} from '../storage';
import {
  EmailAttachment,
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  ProviderCapabilities,
  TempAccount,
} from '../types';
import {
  ProviderHttpError,
  fetchBinary,
  fetchJson,
  generateRandomPassword,
  generateRandomUsername,
  parseSender,
  safeIsoDate,
  sanitizeUsername,
  stripHtml,
  triggerBlobDownload,
  wrapPlainTextAsHtml,
} from './http';

interface HydraMailConfig {
  id: 'mail.tm' | 'mail.gw';
  proxyBase: string;
  capabilities: ProviderCapabilities;
}

interface HydraDomainItem {
  domain?: string;
  isActive?: boolean;
}

interface HydraDomainsResponse {
  'hydra:member'?: HydraDomainItem[];
}

interface HydraMessageRaw {
  id: string;
  from?: unknown;
  to?: unknown;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string | string[];
  hasAttachments?: boolean;
  attachments?: Array<{
    id?: string;
    filename?: string;
    contentType?: string;
    size?: number;
    downloadUrl?: string;
  }>;
  createdAt?: string;
}

export function createHydraMailAdapter(config: HydraMailConfig): MailProviderAdapter {
  const proxyUrl = (path: string) => `${config.proxyBase}?path=${encodeURIComponent(path)}`;

  const refreshTokenIfPossible = async (account: TempAccount): Promise<string | null> => {
    if (!account.address || !account.password) return null;
    try {
      const tokenRes = await fetchJson<{ token?: string; id?: string }>(proxyUrl('/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, password: account.password }),
      });
      if (!tokenRes.token) return null;
      await writeAccountStorage({
        ...account,
        token: tokenRes.token,
        accountId: tokenRes.id || account.accountId,
      });
      return tokenRes.token;
    } catch {
      return null;
    }
  };

  const withAuth = async <T>(fn: (token: string, account: TempAccount) => Promise<T>): Promise<T> => {
    const account = await readAccountStorage(config.id);
    if (!account?.token) {
      throw new ProviderHttpError('No active inbox session found.', 401, 'unauthorized');
    }

    try {
      return await fn(account.token, account);
    } catch (err) {
      if (err instanceof ProviderHttpError && err.code === 'unauthorized') {
        const refreshedToken = await refreshTokenIfPossible(account);
        if (refreshedToken) {
          return fn(refreshedToken, { ...account, token: refreshedToken });
        }
      }
      throw err;
    }
  };

  return {
    id: config.id,
    capabilities: config.capabilities,

    async getDomains(): Promise<string[]> {
      const data = await fetchJson<HydraDomainsResponse | HydraDomainItem[]>(proxyUrl('/domains'));
      const list = Array.isArray(data) ? data : data?.['hydra:member'] || [];
      return list
        .filter((d) => d && typeof d.domain === 'string' && d.isActive !== false)
        .map((d) => String(d.domain));
    },

    async getStoredAccount(): Promise<TempAccount | null> {
      return readAccountStorage(config.id);
    },

    async createAccount(username?: string, domain?: string): Promise<TempAccount> {
      let targetDomain = (domain || '').trim();
      if (!targetDomain) {
        const domains = await this.getDomains!();
        targetDomain = domains[0] || '';
      }
      if (!targetDomain) {
        throw new ProviderHttpError('No active domains returned by provider.', 502, 'upstream');
      }

      const cleanUser = username ? sanitizeUsername(username) : generateRandomUsername(10);
      const address = `${cleanUser}@${targetDomain}`;
      const password = generateRandomPassword(14);

      const created = await fetchJson<{ id?: string; address?: string }>(proxyUrl('/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });

      const tokenRes = await fetchJson<{ token?: string; id?: string }>(proxyUrl('/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });

      if (!tokenRes?.token) {
        throw new ProviderHttpError('Authentication token missing from provider.', 502, 'upstream');
      }

      const account: TempAccount = {
        provider: config.id,
        address: created?.address || address,
        token: tokenRes.token,
        password,
        accountId: created?.id || tokenRes.id,
        emailUser: cleanUser,
        domain: targetDomain,
      };
      await writeAccountStorage(account);
      return account;
    },

    async fetchMessages(): Promise<EmailSummary[]> {
      return withAuth(async (token) => {
        const res = await fetchJson<{ 'hydra:member'?: HydraMessageRaw[] } | HydraMessageRaw[]>(
          proxyUrl('/messages'),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const members = Array.isArray(res) ? res : res?.['hydra:member'] || [];
        return members.map((msg) => {
          const sender = parseSender(msg.from);
          return {
            id: String(msg.id),
            fromName: sender.name,
            fromAddress: sender.address,
            subject: msg.subject || '(No subject)',
            preview: msg.intro || '',
            receivedAt: safeIsoDate(msg.createdAt),
            hasAttachments: Boolean(msg.hasAttachments),
          };
        });
      });
    },

    async fetchMessageDetail(id: string): Promise<EmailDetail> {
      return withAuth(async (token) => {
        const msg = await fetchJson<HydraMessageRaw>(
          proxyUrl(`/messages/${encodeURIComponent(id)}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const sender = parseSender(msg.from);
        const toList = Array.isArray(msg.to)
          ? msg.to.map((item) => parseSender(item).address).filter(Boolean)
          : [];

        const htmlContent = Array.isArray(msg.html)
          ? msg.html.join('')
          : typeof msg.html === 'string'
            ? msg.html
            : '';
        const textContent = msg.text || (htmlContent ? stripHtml(htmlContent) : '');
        const attachments: EmailAttachment[] = Array.isArray(msg.attachments)
          ? msg.attachments.map((att, index) => ({
              id: String(att.id || index),
              filename: att.filename || `attachment-${index + 1}`,
              contentType: att.contentType || 'application/octet-stream',
              size: Number(att.size || 0),
              downloadUrl: String(att.downloadUrl || ''),
            }))
          : [];

        return {
          id: String(msg.id || id),
          fromName: sender.name,
          fromAddress: sender.address,
          subject: msg.subject || '(No subject)',
          preview: msg.intro || textContent.slice(0, 120),
          receivedAt: safeIsoDate(msg.createdAt),
          hasAttachments: attachments.length > 0 || Boolean(msg.hasAttachments),
          toAddresses: toList,
          text: textContent || '(No content available)',
          html: htmlContent || wrapPlainTextAsHtml(textContent),
          attachments,
        };
      });
    },

    async deleteMessage(id: string): Promise<void> {
      return withAuth(async (token) => {
        await fetchJson(proxyUrl(`/messages/${encodeURIComponent(id)}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      });
    },

    async downloadAttachment(downloadUrl: string, filename: string): Promise<void> {
      if (!downloadUrl) {
        throw new ProviderHttpError('Attachment URL is missing.', 400, 'upstream');
      }

      const relativePath = downloadUrl.startsWith('http')
        ? new URL(downloadUrl).pathname + new URL(downloadUrl).search
        : downloadUrl.startsWith('/')
          ? downloadUrl
          : `/${downloadUrl}`;

      await withAuth(async (token) => {
        const blob = await fetchBinary(proxyUrl(relativePath), {
          headers: { Authorization: `Bearer ${token}` },
        });
        triggerBlobDownload(blob, filename || 'attachment');
      });
    },

    async resetSession(): Promise<void> {
      await clearAccountStorage(config.id);
    },
  };
}
