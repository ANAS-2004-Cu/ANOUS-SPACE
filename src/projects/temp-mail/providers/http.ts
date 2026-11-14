export class ProviderHttpError extends Error {
  status: number;
  code: 'unauthorized' | 'network' | 'upstream';

  constructor(
    message: string,
    status: number,
    code: 'unauthorized' | 'network' | 'upstream' = 'upstream'
  ) {
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ProviderHttpError(
      'Unable to reach mail server. Check your connection and try again.',
      0,
      'network'
    );
  }

  const rawText = await response.text();
  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    const errObj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
    const message =
      (errObj &&
        (typeof errObj.detail === 'string'
          ? errObj.detail
          : typeof errObj.message === 'string'
            ? errObj.message
            : typeof errObj.error === 'string'
              ? errObj.error
              : undefined)) ||
      (response.status === 401 || response.status === 403
        ? 'Session expired or unauthorized.'
        : `Request failed with status ${response.status}`);

    throw new ProviderHttpError(
      message,
      response.status,
      response.status === 401 || response.status === 403 ? 'unauthorized' : 'upstream'
    );
  }

  return data as T;
}

export async function postGraphQL<T>(
  proxyUrl: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const payload = await fetchJson<{ data?: T; errors?: Array<{ message?: string }> }>(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });

  if (Array.isArray(payload?.errors) && payload.errors.length > 0 && !payload.data) {
    const firstMsg = payload.errors[0]?.message || 'GraphQL query failed.';
    throw new ProviderHttpError(firstMsg, 400, 'upstream');
  }

  if (!payload || payload.data === undefined) {
    throw new ProviderHttpError('Malformed GraphQL response from provider.', 502, 'upstream');
  }

  return payload.data;
}

export async function fetchBinary(url: string, options: RequestInit = {}): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ProviderHttpError('Failed to download attachment.', 0, 'network');
  }

  if (!response.ok) {
    throw new ProviderHttpError(
      `Attachment download failed (${response.status}).`,
      response.status,
      'upstream'
    );
  }

  return response.blob();
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename || 'attachment';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

export function generateRandomUsername(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomPassword(length = 14): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9._-]/g, '');
  return cleaned || generateRandomUsername(10);
}

export function parseSender(raw: unknown): { name: string; address: string } {
  if (!raw) {
    return { name: 'Unknown', address: '' };
  }

  if (Array.isArray(raw)) {
    return parseSender(raw[0]);
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const address = String(obj.address || obj.email || obj.mail || '').trim();
    const name = String(obj.name || obj.fromName || address.split('@')[0] || 'Unknown').trim();
    return { name: name || address || 'Unknown', address };
  }

  const str = String(raw).trim();
  if (!str) return { name: 'Unknown', address: '' };

  const match = str.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
  if (match) {
    const address = match[2].trim();
    const name = match[1]?.trim() || address.split('@')[0] || address;
    return { name, address };
  }

  if (str.includes('@')) {
    return { name: str.split('@')[0] || str, address: str };
  }

  return { name: str, address: '' };
}

export function safeIsoDate(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw === 'number') {
    const ms = raw < 10_000_000_000 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  const str = String(raw).trim();
  if (!str) return '';

  if (/^\d+$/.test(str)) {
    const num = Number(str);
    const ms = num < 10_000_000_000 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)
    ? `${str.replace(' ', 'T')}Z`
    : str;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? str : parsed.toISOString();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wrapPlainTextAsHtml(text: string): string {
  const safe = escapeHtml(text || '').replace(/\n/g, '<br/>');
  return `<div style="font-family: 'Inter', system-ui, sans-serif; line-height: 1.65;">${safe || '<p>(No content)</p>'}</div>`;
}
