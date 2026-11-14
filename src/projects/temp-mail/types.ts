export type MailProviderId =
  | 'mail.tm'
  | 'mail.gw'
  | 'catchmail.io'
  | '1secmail'
  | 'inboxes.com'
  | 'tempmail.lol'
  | 'tempmail.plus'
  | 'dropmail.me'
  | 'maildrop.cc'
  | 'guerrillamail';

export type ProviderMode = 'stateless' | 'token' | 'session';
export type DomainListMode = 'api' | 'fixed' | 'auto';
export type ProviderProtocol = 'rest' | 'query' | 'graphql';

export interface ProviderCapabilities {
  mode: ProviderMode;
  supportsDomainList: DomainListMode;
  supportsCustomUsername: boolean;
  supportsDelete: boolean;
  inlineMessageBody: boolean;
  supportsAttachments: boolean;
  protocol: ProviderProtocol;
  fixedDomains?: readonly string[];
}

export interface ProviderMeta {
  id: MailProviderId;
  label: string;
  shortDescription: string;
  capabilities: ProviderCapabilities;
}

export interface TempAccount {
  provider: MailProviderId;
  address: string;
  token?: string;
  password?: string;
  accountId?: string;
  emailUser?: string;
  mailbox?: string;
  domain?: string;
  expiresAt?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
}

export interface EmailSummary {
  id: string;
  fromName: string;
  fromAddress: string;
  subject: string;
  preview: string;
  receivedAt: string;
  hasAttachments: boolean;
}

export interface EmailDetail extends EmailSummary {
  toAddresses: string[];
  text: string;
  html: string;
  attachments: EmailAttachment[];
}

export interface MailProviderAdapter {
  id: MailProviderId;
  capabilities: ProviderCapabilities;
  getDomains?: () => Promise<string[]>;
  getStoredAccount: () => Promise<TempAccount | null>;
  createAccount: (username?: string, domain?: string) => Promise<TempAccount>;
  fetchMessages: () => Promise<EmailSummary[]>;
  fetchMessageDetail: (id: string) => Promise<EmailDetail>;
  deleteMessage: (id: string) => Promise<void>;
  downloadAttachment?: (downloadUrl: string, filename: string) => Promise<void>;
  resetSession?: () => Promise<void>;
}

export const normalizeProviderId = (raw?: string | null): MailProviderId => {
  const value = (raw || '').trim().toLowerCase();
  switch (value) {
    case 'mail.gw':
    case 'mailgw':
      return 'mail.gw';
    case 'catchmail.io':
    case 'catchmail':
      return 'catchmail.io';
    case '1secmail':
    case 'onesecmail':
      return '1secmail';
    case 'inboxes.com':
    case 'inboxes':
      return 'inboxes.com';
    case 'tempmail.lol':
    case 'tempmail-lol':
      return 'tempmail.lol';
    case 'tempmail.plus':
    case 'tempmail-plus':
      return 'tempmail.plus';
    case 'dropmail.me':
    case 'dropmail':
      return 'dropmail.me';
    case 'maildrop.cc':
    case 'maildrop':
      return 'maildrop.cc';
    case 'guerrillamail':
    case 'guerrilla':
      return 'guerrillamail';
    case 'mail.tm':
    case 'mailtm':
    default:
      return 'mail.tm';
  }
};
