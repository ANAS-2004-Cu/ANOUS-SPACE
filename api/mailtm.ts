import axios from 'axios';

declare const Buffer:
  | {
      from(data: ArrayBuffer | Uint8Array | string, encoding?: string): { toString(encoding?: string): string; length: number };
      isBuffer(obj: unknown): boolean;
      concat(chunks: unknown[]): { toString(encoding: string): string };
    }
  | undefined;

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const DOMAINS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedDomainsBytes: Uint8Array | null = null;
let cachedDomainsContentType = 'application/json; charset=utf-8';
let cachedDomainsAt = 0;

function sanitizePath(rawPath: string | null, fallback: string): string {
  const path = rawPath || fallback;
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return `/${path.replace(/^\/+/, '')}`;
}

async function resolveRequestBody(req: any): Promise<string> {
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer && Buffer.isBuffer(req.body)) {
    return (req.body as { toString(enc: string): string }).toString('utf8');
  }
  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return new Promise((resolve) => {
    const chunks: unknown[] = [];
    if (typeof req?.on !== 'function') {
      resolve('{}');
      return;
    }
    req.on('data', (chunk: unknown) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve('{}');
        return;
      }
      if (Buffer) {
        resolve(Buffer.concat(chunks).toString('utf8'));
      } else {
        resolve(chunks.map((c) => String(c)).join(''));
      }
    });
    req.on('error', () => resolve('{}'));
  });
}

function sendBytes(res: any, status: number, bytes: Uint8Array) {
  res.status(status).send(Buffer ? Buffer.from(bytes) : bytes);
}

async function fetchDomainsViaRelay(): Promise<Uint8Array | null> {
  try {
    const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.mail.tm/domains')}`;
    const relayRes = await axios.get<ArrayBuffer>(relayUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
      validateStatus: () => true,
    });
    if (relayRes.status >= 200 && relayRes.status < 300 && relayRes.data) {
      const bytes = new Uint8Array(relayRes.data);
      if (bytes.length > 10) {
        return bytes;
      }
    }
  } catch {
    // Ignore relay fallback failure
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const targetPath = sanitizePath(reqUrl.searchParams.get('path'), '/domains');
    const targetUrl = `https://api.mail.tm${targetPath}`;
    const method = (req.method || 'GET').toUpperCase();

    if (
      method === 'GET' &&
      targetPath === '/domains' &&
      cachedDomainsBytes &&
      Date.now() - cachedDomainsAt < DOMAINS_CACHE_TTL_MS
    ) {
      res.setHeader('Content-Type', cachedDomainsContentType);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      sendBytes(res, 200, cachedDomainsBytes);
      return;
    }

    const incomingAccept = String(req.headers?.accept || '').trim();
    const acceptHeader =
      !incomingAccept || incomingAccept === '*/*' || incomingAccept.includes('text/html')
        ? 'application/json, application/ld+json'
        : incomingAccept;

    const headers: Record<string, string> = {
      Accept: acceptHeader,
      Origin: 'https://mail.tm',
      Referer: 'https://mail.tm/',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': PROXY_USER_AGENT,
    };

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader) {
      headers['Authorization'] = String(authHeader);
    }

    let requestData: string | undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const incomingContentType = String(req.headers?.['content-type'] || '').trim();
      headers['Content-Type'] =
        incomingContentType ||
        (method === 'PATCH' ? 'application/merge-patch+json' : 'application/json');
      requestData = await resolveRequestBody(req);
    }

    const upstream = await axios.request<ArrayBuffer>({
      url: targetUrl,
      method,
      headers,
      data: requestData,
      responseType: 'arraybuffer',
      timeout: 12000,
      validateStatus: () => true,
    });

    const contentType =
      String(upstream.headers['content-type'] || '') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    const disposition = upstream.headers['content-disposition'];
    if (disposition) {
      res.setHeader('Content-Disposition', String(disposition));
    }
    const retryAfter = upstream.headers['retry-after'];
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
    }

    if (upstream.status === 204) {
      res.status(204).end();
      return;
    }

    const bytes = new Uint8Array(upstream.data || new ArrayBuffer(0));

    if (
      method === 'GET' &&
      targetPath === '/domains' &&
      upstream.status >= 200 &&
      upstream.status < 300 &&
      bytes.length > 2
    ) {
      cachedDomainsBytes = bytes;
      cachedDomainsContentType = contentType;
      cachedDomainsAt = Date.now();
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }

    if (upstream.status === 403 || upstream.status === 429) {
      if (method === 'GET' && targetPath === '/domains') {
        if (cachedDomainsBytes) {
          res.setHeader('Content-Type', cachedDomainsContentType);
          sendBytes(res, 200, cachedDomainsBytes);
          return;
        }
        const relayed = await fetchDomainsViaRelay();
        if (relayed) {
          cachedDomainsBytes = relayed;
          cachedDomainsContentType = 'application/json; charset=utf-8';
          cachedDomainsAt = Date.now();
          res.setHeader('Content-Type', cachedDomainsContentType);
          res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
          sendBytes(res, 200, relayed);
          return;
        }
      }

      if (bytes.length === 0) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(upstream.status).json({
          error:
            upstream.status === 429
              ? 'Mail.tm rate limit reached (10 requests/min). Please wait a few seconds and retry.'
              : 'Mail.tm upstream temporarily rejected the request (HTTP 403). Please retry.',
        });
        return;
      }
    }

    sendBytes(res, upstream.status, bytes);
  } catch {
    res.status(502).json({ error: 'Failed to reach Mail.tm upstream API' });
  }
}
