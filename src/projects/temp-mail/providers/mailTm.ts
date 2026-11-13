import { createHydraMailAdapter } from './hydraMail';

export const mailTmAdapter = createHydraMailAdapter({
  id: 'mail.tm',
  label: 'Mail.TM',
  proxyUrl: '/api/mailtm',
  upstreamOrigin: 'https://api.mail.tm',
  fallbackDomains: ['dollicons.com', 'mail.tm'],
});
