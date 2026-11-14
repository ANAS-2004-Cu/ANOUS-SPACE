declare const Buffer: { from(data: ArrayBuffer | Uint8Array): unknown } | undefined;

const PROXY_USER_AGENT = 'Mozilla/5.0 (compatible; AnousSpace/1.0)';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const rawUrl = String(req.url || '');
    const queryIndex = rawUrl.indexOf('?');
    const queryString = queryIndex !== -1 ? rawUrl.slice(queryIndex) : '?action=getDomainList';
    const targetUrl = `https://www.1secmail.com/api/v1/${queryString}`;

    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: req.headers?.accept || 'application/json, */*',
        'User-Agent': PROXY_USER_AGENT,
      },
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    const disposition = upstream.headers.get('content-disposition');
    if (disposition) {
      res.setHeader('Content-Disposition', disposition);
    }

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.status(upstream.status).send(typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes);
  } catch {
    res.status(502).json({ error: 'Failed to reach 1secmail upstream API' });
  }
}
