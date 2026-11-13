export type MailProviderId =
  | 'mail.tm'
  | 'mail.gw'
  | 'guerrillamail'
  | 'tempmail.lol'
  | 'maildrop.cc'
  | 'inboxes.com'
  | 'tempmail.plus';

export interface ProviderMeta {
  id: MailProviderId;
  label: string;
  accent: string;
  tint: string;
  border: string;
  supportsDomainSelect: boolean;
  supportsAttachments: boolean;
  fixedDomain?: string;
}

export interface TempAccount {
  provider: MailProviderId;
  address: string;
  token?: string;
  password?: string;
  accountId?: string;
  emailUser?: string;
  mailbox?: string;
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
  if (value === 'mail.gw' || value === 'mailgw') {
    return 'mail.gw';
  }
  if (value === 'guerrilla' || value === 'guerrillamail') {
    return 'guerrillamail';
  }
  if (value === 'tempmail.lol') {
    return 'tempmail.lol';
  }
  if (value === 'maildrop.cc' || value === 'maildrop') {
    return 'maildrop.cc';
  }
  if (value === 'inboxes.com' || value === 'inboxes') {
    return 'inboxes.com';
  }
  if (value === 'tempmail.plus') {
    return 'tempmail.plus';
  }
  return 'mail.tm';
};
