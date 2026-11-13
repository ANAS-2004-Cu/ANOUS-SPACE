const MAILDROP_UPSTREAM = 'https://api.maildrop.cc/graphql';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const upstreamResponse = await fetch(MAILDROP_UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
      },
      body: bodyStr,
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(text);
  } catch {
    res.status(502).json({
      error: 'Failed to reach Maildrop GraphQL API',
    });
  }
}
