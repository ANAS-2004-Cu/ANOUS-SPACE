const DEFAULT_TIMEOUT_MS = 15000;

export class ProviderHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
  }
}

function extractReadableError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.violations) && obj.violations.length > 0) {
      const first = obj.violations[0] as Record<string, unknown>;
      if (typeof first?.message === 'string' && first.message.trim().length > 0) {
        return first.message.trim();
      }
    }
    for (const key of ['message', 'error', 'detail', 'hydra:description']) {
      if (typeof obj[key] === 'string' && (obj[key] as string).trim().length > 0) {
        return (obj[key] as string).trim();
      }
    }
  }
  return fallback;
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson =
      contentType.includes('application/json') || contentType.includes('application/ld+json');

    let parsed: unknown = null;
    if (response.status !== 204) {
      const text = await response.text();
      if (text) {
        if (isJson || text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text;
          }
        } else {
          parsed = text;
        }
      }
    }

    if (!response.ok) {
      const message = extractReadableError(
        parsed,
        `Request failed with status ${response.status}`
      );
      throw new ProviderHttpError(message, response.status);
    }

    return parsed as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchBlob(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Blob> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ProviderHttpError(
        `Attachment download failed with status ${response.status}`,
        response.status
      );
    }

    return await response.blob();
  } finally {
    window.clearTimeout(timer);
  }
}

export function generateRandomToken(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSender(rawFrom?: string): { fromName: string; fromAddress: string } {
  const fromStr = String(rawFrom || 'Unknown').trim();
  const matches = fromStr.match(/(.*)<([^>]+)>/);
  if (matches && matches.length > 2) {
    const cleanedName = matches[1].replace(/^["']|["']$/g, '').trim();
    const cleanedAddr = matches[2].trim();
    return {
      fromName: cleanedName || cleanedAddr,
      fromAddress: cleanedAddr,
    };
  }
  return { fromName: fromStr, fromAddress: fromStr };
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename || 'attachment');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
