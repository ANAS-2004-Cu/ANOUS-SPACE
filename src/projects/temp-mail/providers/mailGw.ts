import { createHydraMailAdapter } from './hydraMail';

export const mailGwAdapter = createHydraMailAdapter({
  id: 'mail.gw',
  proxyBase: '/api/mailgw',
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
