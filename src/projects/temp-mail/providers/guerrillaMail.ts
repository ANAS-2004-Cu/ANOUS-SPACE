import {
  clearAccountStorage,
  readAccountStorage,
  readMessageCache,
  writeAccountStorage,
  writeMessageCache,
} from '../storage';
import {
  EmailDetail,
  EmailSummary,
  MailProviderAdapter,
  ProviderCapabilities,
  TempAccount,
} from '../types';
import {
  ProviderHttpError,
  fetchJson,
  parseSender,
  safeIsoDate,
  stripHtml,
  wrapPlainTextAsHtml,
} from './http';

const GUERRILLA_CAPABILITIES: ProviderCapabilities = {
  mode: 'session',
  supportsDomainList: 'auto',
  supportsCustomUsername: false,
  supportsDelete: true,
  inlineMessageBody: false,
  supportsAttachments: false,
  protocol: 'query',
};

interface GuerrillaSessionResponse {
  email_addr?: string;
  sid_token?: string;
  email_user?: string;
}

interface GuerrillaMailRaw {
  mail_id?: string | number;
  mail_from?: string;
  mail_subject?: string;
  mail_excerpt?: string;
  mail_body?: string;
  mail_timestamp?: number | string;
  mail_date?: string;
}

function summaryFromRaw(msg: GuerrillaMailRaw): EmailSummary {
  const sender = parseSender(msg.mail_from);
  return {
    id: String(msg.mail_id || ''),
    fromName: sender.name,
    fromAddress: sender.address,
    subject: msg.mail_subject || '(No subject)',
    preview: msg.mail_excerpt || '',
    receivedAt: safeIsoDate(msg.mail_timestamp ?? msg.mail_date),
    hasAttachments: false,
  };
}

export const guerrillaMailAdapter: MailProviderAdapter = {
  id: 'guerrillamail',
  capabilities: GUERRILLA_CAPABILITIES,

  async getStoredAccount(): Promise<TempAccount | null> {
    return readAccountStorage('guerrillamail');
  },

  async createAccount(): Promise<TempAccount> {
    const res = await fetchJson<GuerrillaSessionResponse>('/api/guerrilla?f=get_email_address');
    const address = String(res?.email_addr || '').trim();
    const sidToken = String(res?.sid_token || '').trim();

    if (!address || !sidToken) {
      throw new ProviderHttpError(
        'Guerrilla Mail did not return an address and session token.',
        502,
        'upstream'
      );
    }

    const [fallbackUser, domain] = address.split('@');
    const account: TempAccount = {
      provider: 'guerrillamail',
      address,
      token: sidToken,
      emailUser: res.email_user || fallbackUser || '',
      domain: domain || 'guerrillamailblock.com',
    };

    await clearAccountStorage('guerrillamail');
    await writeAccountStorage(account);
    return account;
  },

  async fetchMessages(): Promise<EmailSummary[]> {
    const account = await readAccountStorage('guerrillamail');
    if (!account?.token) {
      throw new ProviderHttpError('No active Guerrilla Mail session found.', 401, 'unauthorized');
    }

    const res = await fetchJson<{ list?: GuerrillaMailRaw[]; sid_token?: string }>(
      `/api/guerrilla?f=check_email&sid_token=${encodeURIComponent(account.token)}&seq=0`
    );

    if (res?.sid_token && res.sid_token !== account.token) {
      await writeAccountStorage({ ...account, token: res.sid_token });
    }

    const incoming = Array.isArray(res?.list) ? res.list : [];
    const cachedDetails = readMessageCache('guerrillamail');
    const detailById = new Map<string, EmailDetail>(cachedDetails.map((item) => [item.id, item]));

    for (const raw of incoming) {
      const summary = summaryFromRaw(raw);
      if (!summary.id) continue;
      const existing = detailById.get(summary.id);
      if (existing) {
        detailById.set(summary.id, { ...existing, ...summary });
      } else {
        detailById.set(summary.id, {
          ...summary,
          toAddresses: [account.address],
          text: summary.preview || '',
          html: summary.preview ? wrapPlainTextAsHtml(summary.preview) : '',
          attachments: [],
        });
      }
    }

    const merged = Array.from(detailById.values()).sort((a, b) => {
      const timeB = Date.parse(b.receivedAt) || 0;
      const timeA = Date.parse(a.receivedAt) || 0;
      return timeB - timeA;
    });
    writeMessageCache('guerrillamail', merged);

    return merged.map(({ toAddresses: _to, text: _text, html: _html, attachments: _att, ...summary }) => summary);
  },

  async fetchMessageDetail(id: string): Promise<EmailDetail> {
    const account = await readAccountStorage('guerrillamail');
    if (!account?.token) {
      throw new ProviderHttpError('No active Guerrilla Mail session found.', 401, 'unauthorized');
    }

    const msg = await fetchJson<GuerrillaMailRaw>(
      `/api/guerrilla?f=fetch_email&email_id=${encodeURIComponent(id)}&sid_token=${encodeURIComponent(account.token)}`
    );

    const sender = parseSender(msg.mail_from);
    const bodyRaw = msg.mail_body || msg.mail_excerpt || '';
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(bodyRaw);
    const htmlContent = looksLikeHtml ? bodyRaw : wrapPlainTextAsHtml(bodyRaw);
    const textContent = looksLikeHtml ? stripHtml(bodyRaw) : bodyRaw;

    const detail: EmailDetail = {
      id: String(msg.mail_id || id),
      fromName: sender.name,
      fromAddress: sender.address,
      subject: msg.mail_subject || '(No subject)',
      preview: msg.mail_excerpt || textContent.slice(0, 120),
      receivedAt: safeIsoDate(msg.mail_timestamp ?? msg.mail_date),
      hasAttachments: false,
      toAddresses: [account.address],
      text: textContent || '(No content available)',
      html: htmlContent,
      attachments: [],
    };

    const cached = readMessageCache('guerrillamail');
    const updated = cached.some((item) => item.id === detail.id)
      ? cached.map((item) => (item.id === detail.id ? detail : item))
      : [detail, ...cached];
    writeMessageCache('guerrillamail', updated);

    return detail;
  },

  async deleteMessage(id: string): Promise<void> {
    const account = await readAccountStorage('guerrillamail');
    if (!account?.token) {
      throw new ProviderHttpError('No active Guerrilla Mail session found.', 401, 'unauthorized');
    }

    await fetchJson(
      `/api/guerrilla?f=del_email&email_ids[]=${encodeURIComponent(id)}&sid_token=${encodeURIComponent(account.token)}`
    );

    const cached = readMessageCache('guerrillamail').filter((item) => item.id !== id);
    writeMessageCache('guerrillamail', cached);
  },

  async resetSession(): Promise<void> {
    await clearAccountStorage('guerrillamail');
  },
};
