import * as SecureStore from '../../shared/utils/storage';
import { EmailDetail, MailProviderId } from './types';

export const TEMPMAIL_STORAGE_KEYS = {
  mailTm: 'anous_tempmail_mailtm',
  mailGw: 'anous_tempmail_mailgw',
  guerrilla: 'anous_tempmail_guerrilla',
  tempMailLol: 'anous_tempmail_tempmail_lol',
  maildrop: 'anous_tempmail_maildrop',
  inboxes: 'anous_tempmail_inboxes',
  tempmailPlus: 'anous_tempmail_tempmail_plus',
  guerrillaCache: 'anous_tempmail_guerrilla_cache',
} as const;

const LEGACY_KEYS: Record<MailProviderId, string[]> = {
  'mail.tm': ['mailtm_data'],
  'mail.gw': ['mailgw_data'],
  guerrillamail: ['guerrilla_data'],
  'tempmail.lol': ['tempmail_lol_data'],
  'maildrop.cc': ['maildrop_data'],
  'inboxes.com': [],
  'tempmail.plus': [],
};

const CANONICAL_KEY_BY_PROVIDER: Record<MailProviderId, string> = {
  'mail.tm': TEMPMAIL_STORAGE_KEYS.mailTm,
  'mail.gw': TEMPMAIL_STORAGE_KEYS.mailGw,
  guerrillamail: TEMPMAIL_STORAGE_KEYS.guerrilla,
  'tempmail.lol': TEMPMAIL_STORAGE_KEYS.tempMailLol,
  'maildrop.cc': TEMPMAIL_STORAGE_KEYS.maildrop,
  'inboxes.com': TEMPMAIL_STORAGE_KEYS.inboxes,
  'tempmail.plus': TEMPMAIL_STORAGE_KEYS.tempmailPlus,
};

export interface StoredMailTmData {
  email: string;
  password?: string;
  token: string;
  id?: string;
}

export interface StoredGuerrillaData {
  email_addr: string;
  sid_token: string;
  email_user: string;
}

export interface StoredTempMailLolData {
  address: string;
  token: string;
  emails: EmailDetail[];
}

export interface StoredMaildropData {
  email: string;
  mailbox: string;
}

export interface StoredSimpleMailboxData {
  email: string;
  domain: string;
}

export async function readProviderStorage<T>(provider: MailProviderId): Promise<T | null> {
  const canonicalKey = CANONICAL_KEY_BY_PROVIDER[provider];
  try {
    const canonicalRaw = await SecureStore.getItemAsync(canonicalKey);
    if (canonicalRaw) {
      return JSON.parse(canonicalRaw) as T;
    }

    for (const legacyKey of LEGACY_KEYS[provider]) {
      const legacyRaw = await SecureStore.getItemAsync(legacyKey);
      if (legacyRaw) {
        await SecureStore.setItemAsync(canonicalKey, legacyRaw);
        return JSON.parse(legacyRaw) as T;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function writeProviderStorage<T>(
  provider: MailProviderId,
  value: T
): Promise<void> {
  const canonicalKey = CANONICAL_KEY_BY_PROVIDER[provider];
  await SecureStore.setItemAsync(canonicalKey, JSON.stringify(value));
}

export async function clearProviderStorage(provider: MailProviderId): Promise<void> {
  const canonicalKey = CANONICAL_KEY_BY_PROVIDER[provider];
  await SecureStore.deleteItemAsync(canonicalKey);
  for (const legacyKey of LEGACY_KEYS[provider]) {
    await SecureStore.deleteItemAsync(legacyKey);
  }
}

export function readGuerrillaSessionCache<T>(): T[] {
  try {
    const raw =
      window.sessionStorage.getItem(TEMPMAIL_STORAGE_KEYS.guerrillaCache) ||
      window.sessionStorage.getItem('guerrilla_cached_emails');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as T[];
      }
    }
  } catch {
    // Ignore sessionStorage errors
  }
  return [];
}

export function writeGuerrillaSessionCache<T>(items: T[]): void {
  try {
    window.sessionStorage.setItem(
      TEMPMAIL_STORAGE_KEYS.guerrillaCache,
      JSON.stringify(items)
    );
  } catch {
    // Ignore sessionStorage errors
  }
}

export function clearGuerrillaSessionCache(): void {
  try {
    window.sessionStorage.removeItem(TEMPMAIL_STORAGE_KEYS.guerrillaCache);
    window.sessionStorage.removeItem('guerrilla_cached_emails');
  } catch {
    // Ignore sessionStorage errors
  }
}
