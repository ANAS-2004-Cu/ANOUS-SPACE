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

const FALLBACK_DOMAINS_LIST = ['fldubai.com', 'grabmail.io', 'mixozia.com', 'linqmail.com'];

const buildHydraDomainsPayload = (domains: string[]): string =>
  JSON.stringify({
    '@context': '/contexts/Domain',
    '@id': '/domains',
    '@type': 'hydra:Collection',
    'hydra:totalItems': domains.length,
    'hydra:member': domains.map((domain, idx) => ({
      '@id': `/domains/fallback-${idx + 1}`,
      '@type': 'Domain',
      id: `fallback-${idx + 1}`,
      domain,
      isActive: true,
      isPrivate: false,
    })),
  });

const FALLBACK_DOMAINS_PAYLOAD = buildHydraDomainsPayload(FALLBACK_DOMAINS_LIST);

function encodeFallbackToken(address: string): string {
  const raw = `gmfb:${address.trim().toLowerCase()}`;
  return Buffer ? Buffer.from(raw, 'utf8').toString('base64') : raw;
}

function decodeFallbackToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) return null;
  if (rawToken.startsWith('gmfb:')) {
    return rawToken.slice(5);
  }
  if (!Buffer) return null;
  try {
    const decoded = Buffer.from(rawToken, 'base64').toString('utf8');
    if (decoded.startsWith('gmfb:')) {
      return decoded.slice(5);
    }
  } catch {
    // Not a fallback token
  }
  return null;
}

async function resolveFallbackAddress(addressInput: string): Promise<string> {
  const clean = (addressInput || '').trim().toLowerCase();
  const [rawUser, rawDomain] = clean.split('@');
  const user = (rawUser || 'user').replace(/[^a-z0-9._-]/g, '') || 'user';
  const grabDomains = ['grabmail.io', 'mixozia.com', 'linqmail.com'];
  const domain = grabDomains.includes(rawDomain || '') ? rawDomain! : 'grabmail.io';
  return `${user}@${domain}`;
}

async function handleGrabMailFallback(
  req: any,
  res: any,
  method: string,
  targetPath: string,
  requestData: string | undefined,
  fallbackMailbox: string | null
): Promise<boolean> {
  try {
    if (method === 'POST' && targetPath === '/accounts') {
      const parsed = JSON.parse(requestData || '{}') as { address?: string };
      const address = await resolveFallbackAddress(parsed.address || '');
      const id = `gm-${address}`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(201).json({
        '@context': '/contexts/Account',
        '@id': `/accounts/${id}`,
        '@type': 'Account',
        id,
        address,
        isDisabled: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    if (method === 'POST' && targetPath === '/token') {
      const parsed = JSON.parse(requestData || '{}') as { address?: string };
      const address = await resolveFallbackAddress(parsed.address || '');
      const id = `gm-${address}`;
      const token = encodeFallbackToken(address);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json({ id, token });
      return true;
    }

    if (!fallbackMailbox) {
      return false;
    }

    if (method === 'GET' && targetPath === '/messages') {
      const gmRes = await axios.get(
        `https://grabmail.io/api/v1/mailbox?address=${encodeURIComponent(fallbackMailbox)}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': PROXY_USER_AGENT },
          timeout: 8000,
          validateStatus: () => true,
        }
      );
      const rawMessages = Array.isArray(gmRes.data)
        ? gmRes.data
        : Array.isArray(gmRes.data?.messages)
          ? gmRes.data.messages
          : [];
      const hydraMembers = rawMessages.map((m: any) => ({
        id: String(m.id ?? ''),
        from:
          typeof m.from === 'string'
            ? { address: m.from, name: m.from.split('@')[0] || m.from }
            : m.from || { address: '', name: 'Unknown' },
        to: [{ address: fallbackMailbox, name: fallbackMailbox.split('@')[0] || '' }],
        subject: m.subject || '(No subject)',
        intro: m.preview || m.text || '',
        seen: Boolean(m.seen),
        hasAttachments: Array.isArray(m.attachments)
          ? m.attachments.length > 0
          : Number(m.attachments || 0) > 0 || Boolean(m.hasAttachments),
        createdAt: m.date || m.created_at || new Date().toISOString(),
      }));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json({
        '@context': '/contexts/Message',
        '@id': '/messages',
        '@type': 'hydra:Collection',
        'hydra:totalItems': hydraMembers.length,
        'hydra:member': hydraMembers,
      });
      return true;
    }

    const msgMatch = targetPath.match(/^\/messages\/([^/]+)$/);
    if (msgMatch) {
      const msgId = decodeURIComponent(msgMatch[1]);
      if (method === 'PATCH') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({ id: msgId, seen: true });
        return true;
      }
      if (method === 'DELETE') {
        await axios.delete(
          `https://grabmail.io/api/v1/message/${encodeURIComponent(msgId)}?mailbox=${encodeURIComponent(fallbackMailbox)}`,
          {
            headers: { Accept: 'application/json', 'User-Agent': PROXY_USER_AGENT },
            timeout: 8000,
            validateStatus: () => true,
          }
        );
        res.status(204).end();
        return true;
      }
      if (method === 'GET') {
        const gmRes = await axios.get(
          `https://grabmail.io/api/v1/message/${encodeURIComponent(msgId)}?mailbox=${encodeURIComponent(fallbackMailbox)}`,
          {
            headers: { Accept: 'application/json', 'User-Agent': PROXY_USER_AGENT },
            timeout: 8000,
            validateStatus: () => true,
          }
        );
        const m = gmRes.data || {};
        const attachments = Array.isArray(m.attachments)
          ? m.attachments.map((att: any, idx: number) => {
              const attId = String(att.id ?? idx);
              return {
                id: attId,
                filename: att.filename || att.name || `attachment-${idx + 1}`,
                contentType: att.content_type || att.contentType || 'application/octet-stream',
                size: Number(att.size || 0),
                downloadUrl: `/messages/${encodeURIComponent(msgId)}/attachment/${encodeURIComponent(attId)}`,
              };
            })
          : [];
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({
          id: String(m.id ?? msgId),
          from:
            typeof m.from === 'string'
              ? { address: m.from, name: m.from.split('@')[0] || m.from }
              : m.from || { address: '', name: 'Unknown' },
          to: [{ address: fallbackMailbox, name: fallbackMailbox.split('@')[0] || '' }],
          subject: m.subject || '(No subject)',
          intro: m.preview || '',
          text: m.text || m.preview || '',
          html: m.html ? [m.html] : [],
          seen: true,
          hasAttachments: attachments.length > 0,
          attachments,
          createdAt: m.date || m.created_at || new Date().toISOString(),
        });
        return true;
      }
    }

    const attMatch = targetPath.match(/^\/messages\/([^/]+)\/attachment\/([^/]+)$/);
    if (attMatch && method === 'GET') {
      const msgId = decodeURIComponent(attMatch[1]);
      const attId = decodeURIComponent(attMatch[2]);
      const gmRes = await axios.get<ArrayBuffer>(
        `https://grabmail.io/api/v1/attachment/${encodeURIComponent(attId)}?mailbox=${encodeURIComponent(fallbackMailbox)}&message_id=${encodeURIComponent(msgId)}`,
        {
          responseType: 'arraybuffer',
          headers: { 'User-Agent': PROXY_USER_AGENT },
          timeout: 10000,
          validateStatus: () => true,
        }
      );
      const ct = String(gmRes.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Type', ct);
      sendBytes(res, gmRes.status, new Uint8Array(gmRes.data || new ArrayBuffer(0)));
      return true;
    }

    const srcMatch = targetPath.match(/^\/sources\/([^/]+)$/);
    if (srcMatch && method === 'GET') {
      const msgId = decodeURIComponent(srcMatch[1]);
      const gmRes = await axios.get(
        `https://grabmail.io/api/v1/message/${encodeURIComponent(msgId)}?mailbox=${encodeURIComponent(fallbackMailbox)}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': PROXY_USER_AGENT },
          timeout: 8000,
          validateStatus: () => true,
        }
      );
      const m = gmRes.data || {};
      const rawMime = [
        `From: ${typeof m.from === 'string' ? m.from : m.from?.address || ''}`,
        `To: ${fallbackMailbox}`,
        `Subject: ${m.subject || ''}`,
        `Date: ${m.date || m.created_at || new Date().toUTCString()}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        m.text || m.html || '',
      ].join('\r\n');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).json({ id: msgId, data: rawMime });
      return true;
    }

    if (method === 'DELETE' && targetPath.startsWith('/accounts/')) {
      res.status(204).end();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function fetchDomainsViaRelay(): Promise<Uint8Array | null> {
  try {
    const relayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.mail.tm/domains')}`;
    const relayRes = await axios.get<ArrayBuffer>(relayUrl, {
      responseType: 'arraybuffer',
      timeout: 9000,
      headers: {
        'User-Agent': PROXY_USER_AGENT,
        Accept: 'application/json, application/ld+json, */*',
      },
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

export const config = {
  regions: ['fra1'],
};

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

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const fallbackMailbox = decodeFallbackToken(authHeader ? String(authHeader) : undefined);

    let requestData: string | undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      requestData = await resolveRequestBody(req);
    }

    // If this session is already using a fallback token, route directly to GrabMail fallback
    if (fallbackMailbox) {
      const handled = await handleGrabMailFallback(
        req,
        res,
        method,
        targetPath,
        requestData,
        fallbackMailbox
      );
      if (handled) return;
    }

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

    if (authHeader) {
      headers['Authorization'] = String(authHeader);
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const incomingContentType = String(req.headers?.['content-type'] || '').trim();
      headers['Content-Type'] =
        incomingContentType ||
        (method === 'PATCH' ? 'application/merge-patch+json' : 'application/json');
    }

    const upstream = await axios.request<ArrayBuffer>({
      url: targetUrl,
      method,
      headers,
      data: requestData,
      responseType: 'arraybuffer',
      timeout: 8000,
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

    if (upstream.status === 403 || upstream.status === 429 || upstream.status >= 500) {
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
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).send(FALLBACK_DOMAINS_PAYLOAD);
        return;
      }

      // Automatic fallback to GrabMail on Vercel when api.mail.tm blocks cloud IPs on POST /accounts or POST /token
      if (
        (upstream.status === 403 || upstream.status >= 500) &&
        (targetPath === '/accounts' || targetPath === '/token')
      ) {
        const handled = await handleGrabMailFallback(
          req,
          res,
          method,
          targetPath,
          requestData,
          fallbackMailbox
        );
        if (handled) return;
      }

      if (bytes.length === 0) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(upstream.status).json({
          error:
            upstream.status === 429
              ? 'Mail.tm rate limit reached (10 requests/min). Please wait a few seconds and retry.'
              : 'Mail.tm blocked shared serverless proxy IP (HTTP 403) and disallowed cross-origin browser requests outside mail.tm.',
        });
        return;
      }
    }

    sendBytes(res, upstream.status, bytes);
  } catch {
    res.status(502).json({ error: 'Failed to reach Mail.tm upstream API' });
  }
}
