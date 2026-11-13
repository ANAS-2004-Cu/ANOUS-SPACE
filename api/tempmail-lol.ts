const TEMPMAIL_LOL_UPSTREAM = 'https://api.tempmail.lol';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const endpoint = urlObj.searchParams.get('endpoint') || '/v2/inbox';
    const token = urlObj.searchParams.get('token');
    const targetUrl = token
      ? `${TEMPMAIL_LOL_UPSTREAM}${endpoint}?token=${encodeURIComponent(token)}`
      : `${TEMPMAIL_LOL_UPSTREAM}${endpoint}`;

    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
      },
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(text);
  } catch {
    res.status(502).json({
      error: 'Failed to reach TempMail.lol upstream API',
    });
  }
}
