const INBOXES_UPSTREAM = 'https://inboxes.com/api/v2';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const path = urlObj.searchParams.get('path') || '/domain';
    const safePath = path.startsWith('/') && !path.startsWith('//') ? path : `/${path.replace(/^\/+/, '')}`;
    const targetUrl = `${INBOXES_UPSTREAM}${safePath}`;

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        Accept: req.headers?.accept || 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
      },
    });

    const contentType =
      upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);

    if (upstreamResponse.status === 204) {
      res.end();
      return;
    }

    const bytes = new Uint8Array(await upstreamResponse.arrayBuffer());
    res.send(bytes);
  } catch {
    res.status(502).json({
      error: 'Failed to reach Inboxes.com upstream API',
    });
  }
}
