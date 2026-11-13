import { createHydraMailAdapter } from './hydraMail';

export const mailGwAdapter = createHydraMailAdapter({
  id: 'mail.gw',
  label: 'Mail.gw',
  proxyUrl: '/api/mailgw',
  upstreamOrigin: 'https://api.mail.gw',
  fallbackDomains: ['mail.gw'],
});
