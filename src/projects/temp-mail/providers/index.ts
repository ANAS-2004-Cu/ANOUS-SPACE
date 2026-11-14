import { MailProviderAdapter, MailProviderId, ProviderMeta } from '../types';
import { mailTmAdapter } from './mailTm';
import { mailGwAdapter } from './mailGw';
import { catchmailAdapter } from './catchmail';
import { oneSecMailAdapter } from './oneSecMail';
import { inboxesAdapter } from './inboxes';
import { tempMailLolAdapter } from './tempMailLol';
import { tempmailPlusAdapter, TEMPMAIL_PLUS_DOMAINS } from './tempmailPlus';
import { dropMailAdapter } from './dropMail';
import { maildropAdapter } from './maildrop';
import { guerrillaMailAdapter } from './guerrillaMail';

export { generateRandomUsername } from './http';
export { TEMPMAIL_PLUS_DOMAINS } from './tempmailPlus';

export const PROVIDER_ORDER: MailProviderId[] = [
  'mail.tm',
  'mail.gw',
  'catchmail.io',
  '1secmail',
  'inboxes.com',
  'tempmail.lol',
  'tempmail.plus',
  'dropmail.me',
  'maildrop.cc',
  'guerrillamail',
];

export const PROVIDER_ADAPTERS: Record<MailProviderId, MailProviderAdapter> = {
  'mail.tm': mailTmAdapter,
  'mail.gw': mailGwAdapter,
  'catchmail.io': catchmailAdapter,
  '1secmail': oneSecMailAdapter,
  'inboxes.com': inboxesAdapter,
  'tempmail.lol': tempMailLolAdapter,
  'tempmail.plus': tempmailPlusAdapter,
  'dropmail.me': dropMailAdapter,
  'maildrop.cc': maildropAdapter,
  guerrillamail: guerrillaMailAdapter,
};

export const PROVIDERS_META: Record<MailProviderId, ProviderMeta> = {
  'mail.tm': {
    id: 'mail.tm',
    label: 'Mail.tm',
    shortDescription: 'Authenticated REST inbox with Bearer JWT, attachments, and manual message deletion.',
    capabilities: mailTmAdapter.capabilities,
  },
  'mail.gw': {
    id: 'mail.gw',
    label: 'Mail.gw',
    shortDescription: 'Sibling Hydra Mail infrastructure with Bearer authentication, attachments, and delete.',
    capabilities: mailGwAdapter.capabilities,
  },
  'catchmail.io': {
    id: 'catchmail.io',
    label: 'Catchmail.io',
    shortDescription: 'Zero-signup stateless inbox with @catchmail.io or custom domain routing.',
    capabilities: catchmailAdapter.capabilities,
  },
  '1secmail': {
    id: '1secmail',
    label: '1secmail',
    shortDescription: 'Fast stateless addresses with API-fetched domains and binary attachment downloads.',
    capabilities: oneSecMailAdapter.capabilities,
  },
  'inboxes.com': {
    id: 'inboxes.com',
    label: 'Inboxes.com',
    shortDescription: 'Stateless Public v2 addresses with selectable domains and automatic expiry.',
    capabilities: inboxesAdapter.capabilities,
  },
  'tempmail.lol': {
    id: 'tempmail.lol',
    label: 'Tempmail.lol',
    shortDescription: 'Dynamic v3 auto-generated addresses with token polling and inline message bodies.',
    capabilities: tempMailLolAdapter.capabilities,
  },
  'tempmail.plus': {
    id: 'tempmail.plus',
    label: 'TempMail.Plus',
    shortDescription: 'Custom username across 8 curated domains with attachments and delete support.',
    capabilities: tempmailPlusAdapter.capabilities,
  },
  'dropmail.me': {
    id: 'dropmail.me',
    label: 'DropMail.me',
    shortDescription: 'Ephemeral GraphQL sessions with auto-assigned addresses and inline message delivery.',
    capabilities: dropMailAdapter.capabilities,
  },
  'maildrop.cc': {
    id: 'maildrop.cc',
    label: 'Maildrop.cc',
    shortDescription: 'Stateless GraphQL inbox locked to @maildrop.cc with custom alias and delete mutation.',
    capabilities: maildropAdapter.capabilities,
  },
  guerrillamail: {
    id: 'guerrillamail',
    label: 'Guerrilla Mail',
    shortDescription: 'Classic sid_token session mailbox with auto-assigned address and message deletion.',
    capabilities: guerrillaMailAdapter.capabilities,
  },
};

export function getCapabilityBadges(id: MailProviderId): Array<{
  label: string;
  tone: 'slate' | 'sage' | 'ochre' | 'neutral';
}> {
  const cap = PROVIDER_ADAPTERS[id].capabilities;
  const badges: Array<{
    label: string;
    tone: 'slate' | 'sage' | 'ochre' | 'neutral';
  }> = [];

  if (cap.mode === 'stateless') {
    badges.push({ label: 'Stateless', tone: 'sage' });
  } else if (cap.mode === 'token') {
    badges.push({ label: 'Token Auth', tone: 'slate' });
  } else {
    badges.push({ label: 'Session', tone: 'slate' });
  }

  if (cap.supportsCustomUsername) {
    badges.push({ label: 'Custom Address', tone: 'neutral' });
  } else {
    badges.push({ label: 'Auto-Generated', tone: 'ochre' });
  }

  if (cap.protocol === 'graphql') {
    badges.push({ label: 'GraphQL', tone: 'slate' });
  }

  if (cap.supportsAttachments) {
    badges.push({ label: 'Attachments', tone: 'sage' });
  }

  if (!cap.supportsDelete) {
    badges.push({ label: 'Auto-Expire', tone: 'ochre' });
  }

  return badges;
}

export { TEMPMAIL_PLUS_DOMAINS as PLUS_DOMAINS };
