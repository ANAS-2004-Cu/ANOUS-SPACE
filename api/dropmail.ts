declare const Buffer: { from(data: ArrayBuffer | Uint8Array): unknown } | undefined;

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function mintDropmailToken(): Promise<string> {
  const res = await fetch('https://dropmail.me/api/token/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': PROXY_USER_AGENT,
    },
    body: JSON.stringify({ type: 'af', lifetime: '1d' }),
  });

  if (!res.ok) {
    throw new Error(`Token generation failed (${res.status})`);
  }

  const data = (await res.json()) as { token?: string; error?: string };
  if (!data?.token) {
    throw new Error(data?.error || 'DropMail token missing in response');
  }
  return data.token;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Dropmail-Token');
  res.setHeader('Access-Control-Expose-Headers', 'X-Dropmail-Token');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const reqUrl = new URL(req.url || '', 'http://localhost');
    const providedToken = String(
      req.headers?.['x-dropmail-token'] || reqUrl.searchParams.get('token') || ''
    ).trim();

    let authToken = providedToken.startsWith('af_') ? providedToken : await mintDropmailToken();
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

    let upstream = await fetch(`https://dropmail.me/api/graphql/${encodeURIComponent(authToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': PROXY_USER_AGENT,
      },
      body,
    });

    if ((upstream.status === 401 || upstream.status === 403) && providedToken) {
      authToken = await mintDropmailToken();
      upstream = await fetch(`https://dropmail.me/api/graphql/${encodeURIComponent(authToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': PROXY_USER_AGENT,
        },
        body,
      });
    }

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Dropmail-Token', authToken);

    const bytes = new Uint8Array(await upstream.arrayBuffer());
    res.status(upstream.status).send(typeof Buffer !== 'undefined' ? Buffer.from(bytes) : bytes);
  } catch (err) {
    res.status(502).json({
      error:
        err instanceof Error
          ? `DropMail.me upstream error: ${err.message}`
          : 'Failed to reach DropMail.me GraphQL API',
    });
  }
}
