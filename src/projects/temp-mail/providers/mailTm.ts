import { createHydraMailAdapter } from './hydraMail';

export const mailTmAdapter = createHydraMailAdapter({
  id: 'mail.tm',
  proxyBase: '/api/mailtm',
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
