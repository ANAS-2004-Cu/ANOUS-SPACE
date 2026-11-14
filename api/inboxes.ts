declare const Buffer: { from(data: ArrayBuffer | Uint8Array): unknown } | undefined;

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function sanitizePath(rawPath: string | null, fallback: string): string {
  const path = rawPath || fallback;
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return `/${path.replace(/^\/+/, '')}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const targetPath = sanitizePath(reqUrl.searchParams.get('path'), '/domain');
    const targetUrl = `https://inboxes.com/api/v2${targetPath}`;

    const method = (req.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': PROXY_USER_AGENT,
    };

    const fetchOptions: RequestInit = { method, headers };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);

    if (upstream.status === 204) {
      res.status(204).end();
      return;
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.status(upstream.status).send(typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes);
  } catch {
    res.status(502).json({ error: 'Failed to reach Inboxes.com upstream API' });
  }
}
