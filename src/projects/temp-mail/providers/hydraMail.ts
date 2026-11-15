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
  MailProviderId,
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
  id: MailProviderId;
  proxyBase: string;
  directBase?: string;
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
  seen?: boolean;
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

interface HydraSourceRaw {
  id?: string;
  downloadUrl?: string;
  data?: string;
}

const DOMAIN_CACHE_TTL_MS = 5 * 60 * 1000;

export function createHydraMailAdapter(config: HydraMailConfig): MailProviderAdapter {
  const normalizedDirectBase = config.directBase ? config.directBase.replace(/\/+$/, '') : '';
  const directUrl = (path: string) =>
    `${normalizedDirectBase}${path.startsWith('/') ? path : `/${path}`}`;
  const proxyUrl = (path: string) => `${config.proxyBase}?path=${encodeURIComponent(path)}`;
  const domainStorageKey = `anous_tempmail_domains_${config.id}`;
  let memoryDomains: { list: string[]; cachedAt: number } | null = null;

  const requestJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    if (!normalizedDirectBase) {
      return fetchJson<T>(proxyUrl(path), options);
    }
    try {
      return await fetchJson<T>(directUrl(path), options);
    } catch (err) {
      if (err instanceof ProviderHttpError && err.code === 'network') {
        return fetchJson<T>(proxyUrl(path), options);
      }
      throw err;
    }
  };

  const requestBinary = async (path: string, options: RequestInit = {}): Promise<Blob> => {
    if (!normalizedDirectBase) {
      return fetchBinary(proxyUrl(path), options);
    }
    try {
      return await fetchBinary(directUrl(path), options);
    } catch (err) {
      if (err instanceof ProviderHttpError && err.code === 'network') {
        return fetchBinary(proxyUrl(path), options);
      }
      throw err;
    }
  };

  const readCachedDomains = (allowStale = false): string[] | null => {
    const now = Date.now();
    if (memoryDomains && (allowStale || now - memoryDomains.cachedAt < DOMAIN_CACHE_TTL_MS)) {
      return memoryDomains.list;
    }
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(domainStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { list?: string[]; cachedAt?: number };
      if (Array.isArray(parsed?.list) && parsed.list.length > 0) {
        if (allowStale || (parsed.cachedAt && now - parsed.cachedAt < DOMAIN_CACHE_TTL_MS)) {
          memoryDomains = { list: parsed.list, cachedAt: parsed.cachedAt || now };
          return parsed.list;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  };

  const writeCachedDomains = (list: string[]): void => {
    if (list.length === 0) return;
    const payload = { list, cachedAt: Date.now() };
    memoryDomains = payload;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(domainStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  };

  const refreshTokenIfPossible = async (account: TempAccount): Promise<string | null> => {
    if (!account.address || !account.password) return null;
    try {
      const tokenRes = await requestJson<{ token?: string; id?: string }>('/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
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

  const markMessageSeen = (id: string, token: string): void => {
    void requestJson(`/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seen: true }),
    }).catch(() => {
      // Non-critical seen state update
    });
  };

  return {
    id: config.id,
    capabilities: config.capabilities,

    async getDomains(): Promise<string[]> {
      const fresh = readCachedDomains(false);
      if (fresh) return fresh;

      const extractDomains = (data: HydraDomainsResponse | HydraDomainItem[] | unknown): string[] => {
        const list = Array.isArray(data)
          ? data
          : (data as HydraDomainsResponse | null)?.['hydra:member'] || [];
        return list
          .filter((d) => d && typeof d.domain === 'string' && d.isActive !== false)
          .map((d) => String(d.domain));
      };

      try {
        const data = await requestJson<HydraDomainsResponse | HydraDomainItem[]>('/domains', {
          headers: { Accept: 'application/json' },
        });
        const activeDomains = extractDomains(data);
        if (activeDomains.length > 0) {
          writeCachedDomains(activeDomains);
          return activeDomains;
        }
      } catch (err) {
        const stale = readCachedDomains(true);
        if (stale) return stale;

        if (normalizedDirectBase) {
          try {
            const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
              directUrl('/domains')
            )}`;
            const relayData = await fetchJson<HydraDomainsResponse | HydraDomainItem[]>(relayUrl);
            const relayDomains = extractDomains(relayData);
            if (relayDomains.length > 0) {
              writeCachedDomains(relayDomains);
              return relayDomains;
            }
          } catch {
            // Ignore relay fallback failure and rethrow primary error
          }
        }
        throw err;
      }

      return readCachedDomains(true) || [];
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

      const created = await requestJson<{ id?: string; address?: string }>('/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ address, password }),
      });

      const tokenRes = await requestJson<{ token?: string; id?: string }>('/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
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
        const res = await requestJson<{ 'hydra:member'?: HydraMessageRaw[] } | HydraMessageRaw[]>(
          '/messages',
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
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
        const msg = await requestJson<HydraMessageRaw>(`/messages/${encodeURIComponent(id)}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (msg.seen === false) {
          markMessageSeen(id, token);
        }

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
          ? msg.attachments.map((att, index) => {
              const attId = String(att.id || index);
              return {
                id: attId,
                filename: att.filename || `attachment-${index + 1}`,
                contentType: att.contentType || 'application/octet-stream',
                size: Number(att.size || 0),
                downloadUrl:
                  String(att.downloadUrl || '').trim() ||
                  `/messages/${encodeURIComponent(id)}/attachment/${encodeURIComponent(attId)}`,
              };
            })
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

    async fetchRawSource(id: string): Promise<string> {
      return withAuth(async (token) => {
        const source = await requestJson<HydraSourceRaw>(`/sources/${encodeURIComponent(id)}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        return String(source?.data || '').trim() || JSON.stringify(source, null, 2);
      });
    },

    async deleteMessage(id: string): Promise<void> {
      return withAuth(async (token) => {
        await requestJson(`/messages/${encodeURIComponent(id)}`, {
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
        const blob = await requestBinary(relativePath, {
          headers: { Authorization: `Bearer ${token}` },
        });
        triggerBlobDownload(blob, filename || 'attachment');
      });
    },

    async resetSession(): Promise<void> {
      const account = await readAccountStorage(config.id);
      if (account?.accountId && account?.token) {
        try {
          await requestJson(`/accounts/${encodeURIComponent(account.accountId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${account.token}` },
          });
        } catch {
          // Always clear local session even if server deletion fails or rate-limits
        }
      }
      await clearAccountStorage(config.id);
    },
  };
}
