import { MailProviderAdapter, MailProviderId, ProviderMeta } from '../types';
import { generateRandomToken } from './http';
import { mailTmAdapter } from './mailTm';
import { mailGwAdapter } from './mailGw';
import { guerrillaMailAdapter, GUERRILLA_DOMAINS } from './guerrillaMail';
import { tempMailLolAdapter } from './tempMailLol';
import { maildropAdapter } from './maildrop';
import { inboxesAdapter } from './inboxes';
import { tempmailPlusAdapter, TEMPMAIL_PLUS_DOMAINS } from './tempmailPlus';

export const PROVIDER_ORDER: MailProviderId[] = [
  'mail.tm',
  'mail.gw',
  'guerrillamail',
  'tempmail.lol',
  'maildrop.cc',
  'inboxes.com',
  'tempmail.plus',
];

export const PROVIDERS_META: Record<MailProviderId, ProviderMeta> = {
  'mail.tm': {
    id: 'mail.tm',
    label: 'Mail.TM',
    accent: '#5278A8',
    tint: 'rgba(82, 120, 168, 0.14)',
    border: 'rgba(82, 120, 168, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: true,
  },
  'mail.gw': {
    id: 'mail.gw',
    label: 'Mail.gw',
    accent: '#4B8493',
    tint: 'rgba(75, 132, 147, 0.14)',
    border: 'rgba(75, 132, 147, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: true,
  },
  guerrillamail: {
    id: 'guerrillamail',
    label: 'GuerrillaMail',
    accent: '#4D8B6E',
    tint: 'rgba(77, 139, 110, 0.14)',
    border: 'rgba(77, 139, 110, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: false,
  },
  'tempmail.lol': {
    id: 'tempmail.lol',
    label: 'TempMail.lol',
    accent: '#BD883E',
    tint: 'rgba(189, 136, 62, 0.14)',
    border: 'rgba(189, 136, 62, 0.36)',
    supportsDomainSelect: false,
    supportsAttachments: false,
  },
  'maildrop.cc': {
    id: 'maildrop.cc',
    label: 'Maildrop.cc',
    accent: '#BA5E4E',
    tint: 'rgba(186, 94, 78, 0.14)',
    border: 'rgba(186, 94, 78, 0.36)',
    supportsDomainSelect: false,
    supportsAttachments: false,
    fixedDomain: 'maildrop.cc',
  },
  'inboxes.com': {
    id: 'inboxes.com',
    label: 'Inboxes.com',
    accent: '#A68B60',
    tint: 'rgba(166, 139, 96, 0.14)',
    border: 'rgba(166, 139, 96, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: false,
  },
  'tempmail.plus': {
    id: 'tempmail.plus',
    label: 'TempMail.Plus',
    accent: '#9E5262',
    tint: 'rgba(158, 82, 98, 0.14)',
    border: 'rgba(158, 82, 98, 0.36)',
    supportsDomainSelect: true,
    supportsAttachments: true,
  },
};

export const PROVIDER_ADAPTERS: Record<MailProviderId, MailProviderAdapter> = {
  'mail.tm': mailTmAdapter,
  'mail.gw': mailGwAdapter,
  guerrillamail: guerrillaMailAdapter,
  'tempmail.lol': tempMailLolAdapter,
  'maildrop.cc': maildropAdapter,
  'inboxes.com': inboxesAdapter,
  'tempmail.plus': tempmailPlusAdapter,
};

export const generateRandomUsername = (length: number = 10): string =>
  generateRandomToken(length);

export { GUERRILLA_DOMAINS, TEMPMAIL_PLUS_DOMAINS };
