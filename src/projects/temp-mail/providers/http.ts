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
    const isJson = contentType.includes('application/json') || contentType.includes('application/ld+json');

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
