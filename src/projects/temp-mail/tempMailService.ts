import axios from 'axios';
import { useEffect, useRef } from 'react';

let sessionToken: string | null = null;

export enum TempMailProvider {
  MailTM = 'mail.tm',
  GuerrillaMail = 'guerrillamail',
  TempMailLol = 'tempmail.lol',
  Maildrop = 'maildrop.cc',
}

export interface GuerrillaEmailResponse {
  mail_id: string;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_timestamp: number;
  mail_date: string;
  mail_read: number;
  att: number;
  mail_body?: string;
}

export interface GuerrillaAddressData {
  email_addr: string;
  sid_token: string;
  email_user: string;
}

export interface Email {
  id: string;
  from: {
    address: string;
    name: string;
  };
  to: Array<{
    address: string;
    name: string;
  }>;
  subject: string;
  intro: string;
  text: string;
  html: string;
  createdAt: string;
  hasAttachments: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
  }>;
}

export interface Account {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  id: string;
}

export interface TempMailLolData {
  address: string;
  token: string;
  emails: Email[];
}

export interface MaildropData {
  email: string;
  mailbox: string;
}

// ============================================================================
// 1. GuerrillaMail API (via Vercel / Vite CORS proxy)
// ============================================================================
export const GUERRILLA_BASE_URL = '/api/guerrilla';

export const testGuerrillaDomains = async (
  allDomains: string[],
  sidToken: string
): Promise<string[]> => {
  const workingDomains: string[] = [];
  sessionToken = sidToken;

  for (const domain of allDomains) {
    try {
      const res = await axios.get(
        `${GUERRILLA_BASE_URL}?f=set_domain&domain=${domain}&sid_token=${sidToken}`
      );
      if (res.data && (res.data.email_addr || res.data.simulated)) {
        workingDomains.push(domain);
      }
    } catch {
      // Skip failed domains
    }
  }

  return workingDomains;
};

export const getEmailAddress = async () => {
  try {
    const res = await axios.get(`${GUERRILLA_BASE_URL}?f=get_email_address`);
    const data = res.data;

    if (!data || !data.email_addr) throw new Error('Failed to get Guerrilla email');

    sessionToken = data.sid_token;

    return {
      email: data.email_addr,
      emailUser: data.email_user,
      sidToken: data.sid_token,
    };
  } catch {
    throw new Error('Failed to create temporary email');
  }
};

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const generateRandomString = (length: number = 8): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ============================================================================
// 2. Mail.tm API (https://api.mail.tm)
// ============================================================================
export const MAILTM_API_URL = 'https://api.mail.tm';

export const mailTmApi = axios.create({
  baseURL: MAILTM_API_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    mailTmApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete mailTmApi.defaults.headers.common['Authorization'];
  }
};

export const hydrateMailTmToken = (): string | null => {
  try {
    const raw =
      window.localStorage.getItem('mailtm_data') ||
      window.localStorage.getItem('mailgw_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        setAuthToken(parsed.token);
        return parsed.token;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
};

export const hydrateMailGwToken = hydrateMailTmToken;

hydrateMailTmToken();

export const getDomains = async () => {
  try {
    const response = await mailTmApi.get('/domains');
    return response.data;
  } catch {
    throw new Error('Error fetching domains');
  }
};

export const createAccount = async (address: string, password: string) => {
  try {
    const response = await mailTmApi.post('/accounts', {
      address,
      password,
    });
    return response.data;
  } catch {
    throw new Error('Error creating account');
  }
};

export const login = async (address: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await mailTmApi.post('/token', {
      address,
      password,
    });

    const { token, id } = response.data;
    setAuthToken(token);
    return { token, id };
  } catch {
    throw new Error('Error logging in');
  }
};

export const getAccountDetails = async (id: string): Promise<Account> => {
  try {
    hydrateMailTmToken();
    const response = await mailTmApi.get(`/accounts/${id}`);
    return response.data;
  } catch {
    throw new Error('Error getting account details');
  }
};

export const getMessages = async (page = 1): Promise<Email[]> => {
  try {
    hydrateMailTmToken();
    const response = await mailTmApi.get('/messages', {
      params: { page },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data['hydra:member'] || [];
  } catch {
    throw new Error('Error fetching messages');
  }
};

export const getMessage = async (id: string): Promise<Email> => {
  try {
    hydrateMailTmToken();
    const response = await mailTmApi.get(`/messages/${id}`);
    return response.data;
  } catch {
    throw new Error('Error fetching message details');
  }
};

export const deleteMessage = async (id: string): Promise<void> => {
  try {
    hydrateMailTmToken();
    await mailTmApi.delete(`/messages/${id}`);
  } catch {
    throw new Error('Error deleting message');
  }
};

export const downloadMailTmAttachment = async (
  downloadUrl: string,
  filename: string
): Promise<void> => {
  hydrateMailTmToken();
  const fullUrl = downloadUrl.startsWith('http')
    ? downloadUrl
    : `${MAILTM_API_URL}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
  const response = await mailTmApi.get(fullUrl, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename || 'attachment');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const verifyToken = async (): Promise<boolean> => {
  try {
    hydrateMailTmToken();
    await mailTmApi.get('/me');
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// 3. TempMail.lol API (https://api.tempmail.lol)
// ============================================================================
const TEMPMAIL_LOL_DIRECT = 'https://api.tempmail.lol';
const TEMPMAIL_LOL_STORAGE_KEY = 'tempmail_lol_data';

export const createTempMailLolInbox = async (prefix?: string): Promise<TempMailLolData> => {
  const payload = prefix && prefix.trim().length > 0 ? { prefix: prefix.trim() } : {};
  let data: { address: string; token: string } | null = null;

  try {
    const res = await axios.post(`${TEMPMAIL_LOL_DIRECT}/v2/inbox/create`, payload);
    data = res.data;
  } catch {
    const proxyRes = await axios.post(`/api/tempmail-lol?endpoint=/v2/inbox/create`, payload);
    data = proxyRes.data;
  }

  if (!data || !data.address || !data.token) {
    throw new Error('Failed to create TempMail.lol address');
  }

  const stored: TempMailLolData = {
    address: data.address,
    token: data.token,
    emails: [],
  };
  window.localStorage.setItem(TEMPMAIL_LOL_STORAGE_KEY, JSON.stringify(stored));
  return stored;
};

export const getTempMailLolStoredData = (): TempMailLolData | null => {
  try {
    const raw = window.localStorage.getItem(TEMPMAIL_LOL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TempMailLolData;
  } catch {
    return null;
  }
};

export const fetchTempMailLolMessages = async (): Promise<Email[]> => {
  const stored = getTempMailLolStoredData();
  if (!stored || !stored.token) {
    throw new Error('No active TempMail.lol session');
  }

  let rawData: any = null;
  try {
    const res = await axios.get(`${TEMPMAIL_LOL_DIRECT}/v2/inbox`, {
      params: { token: stored.token },
    });
    rawData = res.data;
  } catch {
    const proxyRes = await axios.get(`/api/tempmail-lol`, {
      params: { endpoint: '/v2/inbox', token: stored.token },
    });
    rawData = proxyRes.data;
  }

  const incomingList: any[] = Array.isArray(rawData?.emails) ? rawData.emails : [];
  const normalizedIncoming: Email[] = incomingList.map((item: any, idx: number) => {
    const timestampMs = item.date
      ? item.date > 1e12
        ? item.date
        : item.date * 1000
      : Date.now();
    const createdAt = new Date(timestampMs).toISOString();
    const fromStr = String(item.from || 'Unknown');
    const matches = fromStr.match(/(.*)\s<(.*)>/);
    const fromName = matches ? matches[1].trim() : fromStr;
    const fromAddress = matches ? matches[2].trim() : fromStr;
    const bodyText = item.body || '';
    const bodyHtml =
      item.html || `<pre style="white-space:pre-wrap;color:#F3F4F6">${bodyText}</pre>`;
    const id =
      item.id ||
      `tmlol-${timestampMs}-${idx}-${fromAddress.replace(/[^a-zA-Z0-9]/g, '')}`;

    return {
      id,
      from: { name: fromName, address: fromAddress },
      to: [{ name: '', address: item.to || stored.address }],
      subject: item.subject || '(No subject)',
      intro: bodyText.slice(0, 120) || '(No content)',
      text: bodyText,
      html: bodyHtml,
      createdAt,
      hasAttachments: false,
    };
  });

  const existing = Array.isArray(stored.emails) ? stored.emails : [];
  const existingIds = new Set(existing.map((e) => e.id));
  const newUnique = normalizedIncoming.filter((e) => !existingIds.has(e.id));
  const merged = [...newUnique, ...existing];

  const updated: TempMailLolData = {
    ...stored,
    emails: merged,
  };
  window.localStorage.setItem(TEMPMAIL_LOL_STORAGE_KEY, JSON.stringify(updated));
  return merged;
};

export const getTempMailLolMessage = (id: string): Email | null => {
  const stored = getTempMailLolStoredData();
  if (!stored || !Array.isArray(stored.emails)) return null;
  return stored.emails.find((e) => e.id === id) || null;
};

export const deleteTempMailLolMessage = (id: string): Email[] => {
  const stored = getTempMailLolStoredData();
  if (!stored) return [];
  const nextEmails = (stored.emails || []).filter((e) => e.id !== id);
  const updated: TempMailLolData = {
    ...stored,
    emails: nextEmails,
  };
  window.localStorage.setItem(TEMPMAIL_LOL_STORAGE_KEY, JSON.stringify(updated));
  return nextEmails;
};

// ============================================================================
// 4. Maildrop.cc GraphQL API (https://api.maildrop.cc/graphql)
// ============================================================================
const MAILDROP_STORAGE_KEY = 'maildrop_data';

const executeMaildropGraphQL = async (query: string, variables: Record<string, any>) => {
  try {
    const res = await axios.post('/api/maildrop', { query, variables });
    if (res.data?.data) return res.data.data;
  } catch {
    // Fallback to direct endpoint
  }
  const directRes = await axios.post('https://api.maildrop.cc/graphql', {
    query,
    variables,
  });
  return directRes.data?.data;
};

export const createMaildropAccount = (username: string): MaildropData => {
  const cleanUser =
    username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || generateRandomString(10);
  const data: MaildropData = {
    email: `${cleanUser}@maildrop.cc`,
    mailbox: cleanUser,
  };
  window.localStorage.setItem(MAILDROP_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getMaildropStoredData = (): MaildropData | null => {
  try {
    const raw = window.localStorage.getItem(MAILDROP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MaildropData;
  } catch {
    return null;
  }
};

export const fetchMaildropMessages = async (): Promise<Email[]> => {
  const stored = getMaildropStoredData();
  if (!stored || !stored.mailbox) {
    throw new Error('No active Maildrop.cc mailbox');
  }

  const query = `
    query GetInbox($mailbox: String!) {
      inbox(mailbox: $mailbox) {
        id
        headerfrom
        subject
        date
      }
    }
  `;
  const data = await executeMaildropGraphQL(query, { mailbox: stored.mailbox });
  const list: any[] = Array.isArray(data?.inbox) ? data.inbox : [];

  return list.map((item: any) => {
    const fromStr = String(item.headerfrom || 'Unknown');
    const matches = fromStr.match(/(.*)\s<(.*)>/);
    const fromName = matches ? matches[1].replace(/^"|"$/g, '').trim() : fromStr;
    const fromAddress = matches ? matches[2].trim() : fromStr;

    return {
      id: item.id,
      from: { name: fromName, address: fromAddress },
      to: [{ name: stored.mailbox, address: stored.email }],
      subject: item.subject || '(No subject)',
      intro: `Received via Maildrop.cc (${fromName})`,
      text: '',
      html: '',
      createdAt: item.date || new Date().toISOString(),
      hasAttachments: false,
    };
  });
};

export const fetchMaildropMessageDetail = async (id: string): Promise<Email> => {
  const stored = getMaildropStoredData();
  if (!stored || !stored.mailbox) {
    throw new Error('No active Maildrop.cc mailbox');
  }

  const query = `
    query GetMessage($mailbox: String!, $id: String!) {
      message(mailbox: $mailbox, id: $id) {
        id
        headerfrom
        subject
        date
        data
        html
      }
    }
  `;
  const data = await executeMaildropGraphQL(query, { mailbox: stored.mailbox, id });
  const msg = data?.message;
  if (!msg) {
    throw new Error('Maildrop message not found');
  }

  const fromStr = String(msg.headerfrom || 'Unknown');
  const matches = fromStr.match(/(.*)\s<(.*)>/);
  const fromName = matches ? matches[1].replace(/^"|"$/g, '').trim() : fromStr;
  const fromAddress = matches ? matches[2].trim() : fromStr;
  const htmlBody =
    msg.html || `<pre style="white-space:pre-wrap;color:#F3F4F6">${msg.data || ''}</pre>`;
  const plainBody =
    msg.data ||
    (msg.html ? msg.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');

  return {
    id: msg.id,
    from: { name: fromName, address: fromAddress },
    to: [{ name: stored.mailbox, address: stored.email }],
    subject: msg.subject || '(No subject)',
    intro: plainBody.slice(0, 120),
    text: plainBody || 'No content available',
    html: htmlBody,
    createdAt: msg.date || new Date().toISOString(),
    hasAttachments: false,
  };
};

export const deleteMaildropMessage = async (id: string): Promise<boolean> => {
  const stored = getMaildropStoredData();
  if (!stored || !stored.mailbox) return false;

  const query = `
    mutation DeleteMessage($mailbox: String!, $id: String!) {
      delete(mailbox: $mailbox, id: $id)
    }
  `;
  const data = await executeMaildropGraphQL(query, { mailbox: stored.mailbox, id });
  return Boolean(data?.delete);
};

// ============================================================================
// GuerrillaMail Session Helpers
// ============================================================================
export const GUERRILLA_DOMAINS = [
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'guerrillamail.info',
  'grr.la',
  'sharklasers.com',
  'guerrillamail.biz',
  'guerrillamail.de',
  'pokemail.net',
  'spam4.me',
];

let sid_token = '';
let email_user = '';

export const setSidToken = (token: string) => {
  if (token && token.length > 0) {
    sid_token = token;
    return true;
  }
  return false;
};

export const setEmailUser = (user: string) => {
  if (user && user.length > 0) {
    email_user = user;
    return true;
  }
  return false;
};

export const checkInbox = async () => {
  if (!sessionToken) throw new Error('Session not initialized');

  const res = await axios.get(
    `${GUERRILLA_BASE_URL}?f=check_email&sid_token=${sessionToken}&seq=0`
  );

  if (res.data && Array.isArray(res.data.list)) {
    return res.data.list;
  }

  return [];
};

export const fetchEmail = async (emailId: string) => {
  if (!sessionToken) throw new Error('Session not initialized');

  const res = await axios.get(
    `${GUERRILLA_BASE_URL}?f=fetch_email&sid_token=${sessionToken}&email_id=${emailId}`
  );

  return res.data;
};

export const setCustomEmailUser = async (username: string) => {
  if (!sessionToken) throw new Error('Session not initialized');

  const res = await axios.get(
    `${GUERRILLA_BASE_URL}?f=set_email_user&email_user=${username}&sid_token=${sessionToken}`
  );

  const data = res.data;

  if (!data || !data.email_addr) throw new Error('Failed to set username');
  return data;
};

export const setEmailDomain = async (domain: string) => {
  if (!sessionToken) throw new Error('Session not initialized');

  try {
    const res = await axios.get(
      `${GUERRILLA_BASE_URL}?f=set_email_domain&domain_name=${domain}&sid_token=${sessionToken}`
    );
    const data = res.data;

    if (data && (data.email_addr || data.simulated)) {
      return data;
    }
  } catch {
    try {
      const res = await axios.get(
        `${GUERRILLA_BASE_URL}?f=set_domain&domain=${domain}&sid_token=${sessionToken}`
      );
      const data = res.data;

      if (data && (data.email_addr || data.simulated)) {
        return data;
      }
    } catch {
      return { simulated: true };
    }
  }

  return { simulated: true };
};

export const forgetMe = async () => {
  try {
    if (!sid_token) {
      return;
    }

    await fetch(
      `${GUERRILLA_BASE_URL}?f=forget_me&sid_token=${encodeURIComponent(sid_token)}`
    );

    sid_token = '';
    email_user = '';
    sessionToken = null;
  } catch {
    throw new Error('Error forgetting session');
  }
};

export const initializeFromStoredData = ({
  sid_token: token,
  email_user: user,
}: {
  sid_token: string;
  email_user: string;
}) => {
  if (!token || !user) return false;

  sessionToken = token;
  sid_token = token;
  email_user = user;

  return true;
};

export const isInitialized = (_sid_token?: string) => {
  return sessionToken !== null && sessionToken.length > 0;
};
