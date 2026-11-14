import * as SecureStore from '../../shared/utils/storage';
import { EmailDetail, MailProviderId, TempAccount } from './types';

export const TEMPMAIL_STORAGE_KEYS: Record<MailProviderId, string> = {
  'mail.tm': 'anous_tempmail_mailtm',
  'grabmail.io': 'anous_tempmail_grabmail',
  'catchmail.io': 'anous_tempmail_catchmail',
  'temp-mail.io': 'anous_tempmail_tempmail_io',
  'inboxes.com': 'anous_tempmail_inboxes',
  'tempmail.lol': 'anous_tempmail_tempmail_lol',
  'tempmail.plus': 'anous_tempmail_tempmail_plus',
  'dropmail.me': 'anous_tempmail_dropmail',
  'maildrop.cc': 'anous_tempmail_maildrop',
  guerrillamail: 'anous_tempmail_guerrilla',
};

const LEGACY_KEYS: Partial<Record<MailProviderId, string[]>> = {
  'mail.tm': ['mailtm_data'],
  guerrillamail: ['guerrilla_data'],
  'tempmail.lol': ['tempmail_lol_data'],
  'maildrop.cc': ['maildrop_data'],
};

const MESSAGE_CACHE_PREFIX = 'anous_tempmail_msgcache_';

export async function readAccountStorage(provider: MailProviderId): Promise<TempAccount | null> {
  const canonicalKey = TEMPMAIL_STORAGE_KEYS[provider];
  try {
    const raw = await SecureStore.getItemAsync(canonicalKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized = normalizeStoredAccount(provider, parsed);
      if (normalized) return normalized;
    }

    const legacyList = LEGACY_KEYS[provider] || [];
    for (const legacyKey of legacyList) {
      const legacyRaw = await SecureStore.getItemAsync(legacyKey);
      if (!legacyRaw) continue;
      const parsed = JSON.parse(legacyRaw) as Record<string, unknown>;
      const normalized = normalizeStoredAccount(provider, parsed);
      if (normalized) {
        await SecureStore.setItemAsync(canonicalKey, JSON.stringify(normalized));
        return normalized;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeStoredAccount(
  provider: MailProviderId,
  raw: Record<string, unknown>
): TempAccount | null {
  const address = String(raw.address || raw.email || raw.email_addr || '').trim();
  if (!address) return null;

  const atIndex = address.indexOf('@');
  const inferredUser = atIndex !== -1 ? address.slice(0, atIndex) : address;
  const inferredDomain = atIndex !== -1 ? address.slice(atIndex + 1) : '';

  return {
    provider,
    address,
    token:
      typeof raw.token === 'string'
        ? raw.token
        : typeof raw.sid_token === 'string'
          ? raw.sid_token
          : undefined,
    authToken: typeof raw.authToken === 'string' ? raw.authToken : undefined,
    password: typeof raw.password === 'string' ? raw.password : undefined,
    accountId: typeof raw.accountId === 'string' ? raw.accountId : typeof raw.id === 'string' ? raw.id : undefined,
    emailUser:
      typeof raw.emailUser === 'string'
        ? raw.emailUser
        : typeof raw.email_user === 'string'
          ? raw.email_user
          : inferredUser,
    mailbox: typeof raw.mailbox === 'string' ? raw.mailbox : inferredUser,
    domain: typeof raw.domain === 'string' ? raw.domain : inferredDomain,
    expiresAt: typeof raw.expiresAt === 'string' ? raw.expiresAt : undefined,
  };
}

export async function writeAccountStorage(account: TempAccount): Promise<void> {
  const canonicalKey = TEMPMAIL_STORAGE_KEYS[account.provider];
  await SecureStore.setItemAsync(canonicalKey, JSON.stringify(account));
}

export async function clearAccountStorage(provider: MailProviderId): Promise<void> {
  const canonicalKey = TEMPMAIL_STORAGE_KEYS[provider];
  await SecureStore.deleteItemAsync(canonicalKey);
  for (const legacyKey of LEGACY_KEYS[provider] || []) {
    await SecureStore.deleteItemAsync(legacyKey);
  }
  clearMessageCache(provider);
}

export function readMessageCache(provider: MailProviderId): EmailDetail[] {
  try {
    const raw = window.localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${provider}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailDetail[]) : [];
  } catch {
    return [];
  }
}

export function writeMessageCache(provider: MailProviderId, messages: EmailDetail[]): void {
  try {
    window.localStorage.setItem(
      `${MESSAGE_CACHE_PREFIX}${provider}`,
      JSON.stringify(messages.slice(0, 50))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function clearMessageCache(provider: MailProviderId): void {
  try {
    window.localStorage.removeItem(`${MESSAGE_CACHE_PREFIX}${provider}`);
    if (provider === 'guerrillamail') {
      window.sessionStorage.removeItem('anous_tempmail_guerrilla_cache');
      window.sessionStorage.removeItem('guerrilla_cached_emails');
    }
  } catch {
    // Ignore storage errors
  }
}
