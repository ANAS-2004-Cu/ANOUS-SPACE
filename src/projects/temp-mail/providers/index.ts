import { MailProviderAdapter, MailProviderId, ProviderMeta } from '../types';
import { mailTmAdapter } from './mailTm';
import { grabMailAdapter } from './grabMail';
import { catchmailAdapter } from './catchmail';
import { tempMailIoAdapter } from './tempMailIo';
import { inboxesAdapter } from './inboxes';
import { tempMailLolAdapter } from './tempMailLol';
import { tempmailPlusAdapter, TEMPMAIL_PLUS_DOMAINS } from './tempmailPlus';
import { dropMailAdapter } from './dropMail';
import { maildropAdapter } from './maildrop';
import { guerrillaMailAdapter, GUERRILLA_DOMAINS } from './guerrillaMail';

export { generateRandomUsername } from './http';
export { TEMPMAIL_PLUS_DOMAINS } from './tempmailPlus';
export { GUERRILLA_DOMAINS } from './guerrillaMail';

export const PROVIDER_ORDER: MailProviderId[] = [
  'mail.tm',
  'grabmail.io',
  'catchmail.io',
  'temp-mail.io',
  'inboxes.com',
  'tempmail.lol',
  'tempmail.plus',
  'dropmail.me',
  'maildrop.cc',
  'guerrillamail',
];

export const PROVIDER_ADAPTERS: Record<MailProviderId, MailProviderAdapter> = {
  'mail.tm': mailTmAdapter,
  'grabmail.io': grabMailAdapter,
  'catchmail.io': catchmailAdapter,
  'temp-mail.io': tempMailIoAdapter,
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
  'grabmail.io': {
    id: 'grabmail.io',
    label: 'GrabMail',
    shortDescription: 'Zero-signup stateless REST inbox with live public domains, attachments, and message deletion.',
    capabilities: grabMailAdapter.capabilities,
  },
  'catchmail.io': {
    id: 'catchmail.io',
    label: 'Catchmail.io',
    shortDescription: 'Zero-signup stateless inbox with @catchmail.io or custom domain routing.',
    capabilities: catchmailAdapter.capabilities,
  },
  'temp-mail.io': {
    id: 'temp-mail.io',
    label: 'Temp-Mail.io',
    shortDescription: 'Fast REST inbox with custom alias, live domain list, inline bodies, and message deletion.',
    capabilities: tempMailIoAdapter.capabilities,
  },
  'inboxes.com': {
    id: 'inboxes.com',
    label: 'Inboxes.com',
    shortDescription: 'Stateless Public v2 addresses with 18+ selectable domains and automatic expiry.',
    capabilities: inboxesAdapter.capabilities,
  },
  'tempmail.lol': {
    id: 'tempmail.lol',
    label: 'Tempmail.lol',
    shortDescription: 'Dynamic v3 server-assigned addresses with token polling and inline message bodies.',
    capabilities: tempMailLolAdapter.capabilities,
  },
  'tempmail.plus': {
    id: 'tempmail.plus',
    label: 'TempMail.Plus',
    shortDescription: 'Stateless custom alias across 8 curated domains with attachments and delete support.',
    capabilities: tempmailPlusAdapter.capabilities,
  },
  'dropmail.me': {
    id: 'dropmail.me',
    label: 'DropMail.me',
    shortDescription: 'Ephemeral GraphQL sessions with selectable domains, auto-assigned prefix, and inline delivery.',
    capabilities: dropMailAdapter.capabilities,
  },
  'maildrop.cc': {
    id: 'maildrop.cc',
    label: 'Maildrop.cc',
    shortDescription: 'Stateless GraphQL inbox on @maildrop.cc with custom alias and delete mutation.',
    capabilities: maildropAdapter.capabilities,
  },
  guerrillamail: {
    id: 'guerrillamail',
    label: 'Guerrilla Mail',
    shortDescription: 'Classic sid_token mailbox supporting custom alias, 9 selectable domains, and message deletion.',
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
    badges.push({ label: 'Custom Alias', tone: 'neutral' });
  } else {
    badges.push({ label: 'Auto Prefix', tone: 'ochre' });
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
