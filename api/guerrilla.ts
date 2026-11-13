const GUERRILLA_UPSTREAM = 'https://api.guerrillamail.com/ajax.php';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const queryIndex = req.url?.indexOf('?') ?? -1;
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    const targetUrl = `${GUERRILLA_UPSTREAM}${queryString}`;

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
      },
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(text);
  } catch {
    res.status(502).json({
      error: 'Failed to reach GuerrillaMail upstream API',
    });
  }
}
