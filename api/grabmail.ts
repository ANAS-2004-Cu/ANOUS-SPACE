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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const targetPath = sanitizePath(reqUrl.searchParams.get('path'), '/domains');
    const targetUrl = `https://grabmail.io/api/v1${targetPath}`;

    const method = (req.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      Accept: req.headers?.accept || 'application/json, */*',
      'User-Agent': PROXY_USER_AGENT,
    };

    const fetchOptions: RequestInit = { method, headers };
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    const disposition = upstream.headers.get('content-disposition');
    if (disposition) {
      res.setHeader('Content-Disposition', disposition);
    }

    if (upstream.status === 204) {
      res.status(204).end();
      return;
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.status(upstream.status).send(typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? `GrabMail upstream error: ${err.message}` : 'Failed to reach GrabMail upstream API',
    });
  }
}
