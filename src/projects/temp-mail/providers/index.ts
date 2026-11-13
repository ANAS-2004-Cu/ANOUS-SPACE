import { MailProviderAdapter, MailProviderId, ProviderMeta } from '../types';
import { generateRandomToken } from './http';
import { mailTmAdapter } from './mailTm';
import { guerrillaMailAdapter, GUERRILLA_DOMAINS } from './guerrillaMail';
import { tempMailLolAdapter } from './tempMailLol';
import { maildropAdapter } from './maildrop';

export const PROVIDER_ORDER: MailProviderId[] = [
  'mail.tm',
  'guerrillamail',
  'tempmail.lol',
  'maildrop.cc',
];

export const PROVIDERS_META: Record<MailProviderId, ProviderMeta> = {
  'mail.tm': {
    id: 'mail.tm',
    label: 'Mail.TM',
    tagline: 'Full Mailbox',
    description:
      'Custom domain addresses with full HTML rendering and file attachment downloads.',
    accent: '#5278A8',
    tint: 'rgba(82, 120, 168, 0.14)',
    border: 'rgba(82, 120, 168, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: true,
  },
  guerrillamail: {
    id: 'guerrillamail',
    label: 'GuerrillaMail',
    tagline: '11 Domains',
    description:
      'Instant disposable aliases with 11 selectable domains and quick session reset.',
    accent: '#4D8B6E',
    tint: 'rgba(77, 139, 110, 0.14)',
    border: 'rgba(77, 139, 110, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: false,
  },
  'tempmail.lol': {
    id: 'tempmail.lol',
    label: 'TempMail.lol',
    tagline: 'Instant Alias',
    description:
      'Zero-setup temporary address with automatic browser-side message history.',
    accent: '#BD883E',
    tint: 'rgba(189, 136, 62, 0.14)',
    border: 'rgba(189, 136, 62, 0.36)',
    supportsDomainSelect: false,
    supportsAttachments: false,
  },
  'maildrop.cc': {
    id: 'maildrop.cc',
    label: 'Maildrop.cc',
    tagline: 'Open Inbox',
    description:
      'Quick custom @maildrop.cc addresses with no registration or password required.',
    accent: '#BA5E4E',
    tint: 'rgba(186, 94, 78, 0.14)',
    border: 'rgba(186, 94, 78, 0.36)',
    supportsDomainSelect: false,
    supportsAttachments: false,
    fixedDomain: 'maildrop.cc',
  },
};

export const PROVIDER_ADAPTERS: Record<MailProviderId, MailProviderAdapter> = {
  'mail.tm': mailTmAdapter,
  guerrillamail: guerrillaMailAdapter,
  'tempmail.lol': tempMailLolAdapter,
  'maildrop.cc': maildropAdapter,
};

export const generateRandomUsername = (length: number = 10): string =>
  generateRandomToken(length);

export { GUERRILLA_DOMAINS };
