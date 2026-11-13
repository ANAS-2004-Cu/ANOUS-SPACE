export type MailProviderId =
  | 'mail.tm'
  | 'guerrillamail'
  | 'tempmail.lol'
  | 'maildrop.cc';

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
  if (!raw || raw === 'mailgw' || raw === 'mail.tm') {
    return 'mail.tm';
  }
  if (raw === 'guerrilla' || raw === 'guerrillamail') {
    return 'guerrillamail';
  }
  if (raw === 'tempmail.lol') {
    return 'tempmail.lol';
  }
  if (raw === 'maildrop.cc') {
    return 'maildrop.cc';
  }
  return 'mail.tm';
};
