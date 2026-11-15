import { createHydraMailAdapter } from './hydraMail';

export const mailTmAdapter = createHydraMailAdapter({
  id: 'mail.tm',
  directBase: 'https://api.mail.tm',
  proxyBase: '/api/mailtm',
  fallbackDomains: ['fldubai.com'],
  capabilities: {
    mode: 'token',
    supportsDomainList: 'api',
    supportsCustomUsername: true,
    supportsDelete: true,
    inlineMessageBody: false,
    supportsAttachments: true,
    protocol: 'rest',
  },
});
