const MAILTM_UPSTREAM = 'https://api.mail.tm';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const path = urlObj.searchParams.get('path') || '/domains';
    const safePath = path.startsWith('/') ? path : `/${path}`;
    const targetUrl = `${MAILTM_UPSTREAM}${safePath}`;

    const headers: Record<string, string> = {
      Accept: req.headers?.accept || 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
    };

    if (req.headers?.authorization) {
      headers['Authorization'] = String(req.headers.authorization);
    }

    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = req.body
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : '{}';
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
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
      error: 'Failed to reach Mail.TM upstream API',
    });
  }
}
