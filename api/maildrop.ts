declare const Buffer: { from(data: ArrayBuffer | Uint8Array): unknown } | undefined;

const PROXY_USER_AGENT = 'Mozilla/5.0 (compatible; AnousSpace/1.0)';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

    const upstream = await fetch('https://api.maildrop.cc/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': PROXY_USER_AGENT,
      },
      body,
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.status(upstream.status).send(typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes);
  } catch {
    res.status(502).json({ error: 'Failed to reach Maildrop.cc GraphQL API' });
  }
}
