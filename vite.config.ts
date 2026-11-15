import { defineConfig, type Connect } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

interface DevRequest extends Connect.IncomingMessage {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  on?: (event: string, listener: (chunk?: unknown) => void) => void;
}

interface DevResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string | Uint8Array): void;
}

interface PrivateAppRecord {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  to?: string;
  href?: string;
  category?: string;
  type?: 'internal' | 'external';
  badge?: string;
}

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function readRequestBody(req: DevRequest): Promise<string> {
  return new Promise((resolve) => {
    if (!req.on) {
      resolve('');
      return;
    }
    let body = '';
    req.on('data', (chunk: unknown) => {
      body += String(chunk);
    });
    req.on('end', () => resolve(body));
  });
}

function createPathProxyMiddleware(
  upstreamBase: string,
  defaultPath: string,
  providerLabel: string,
  options: {
    forwardAuthorization?: boolean;
    extraHeaders?: Record<string, string>;
    forwardBodyOnDelete?: boolean;
    preserveAtInPath?: boolean;
    defaultAccept?: string;
  } = {}
) {
  return async (req: DevRequest, res: DevResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    const body = await readRequestBody(req);
    try {
      const urlObj = new URL(req.url || '', 'http://localhost');
      let rawPath = urlObj.searchParams.get('path') || defaultPath;
      if (options.preserveAtInPath) {
        rawPath = rawPath.replace(/%40/gi, '@');
      }
      const safePath =
        rawPath.startsWith('/') && !rawPath.startsWith('//')
          ? rawPath
          : `/${rawPath.replace(/^\/+/, '')}`;
      const targetUrl = `${upstreamBase}${safePath}`;

      const incomingAccept = String(req.headers?.accept || '').trim();
      const resolvedAccept =
        options.defaultAccept && (!incomingAccept || incomingAccept === '*/*')
          ? options.defaultAccept
          : incomingAccept || options.defaultAccept || 'application/json, */*';

      const headers: Record<string, string> = {
        Accept: resolvedAccept,
        'User-Agent': PROXY_USER_AGENT,
        ...(options.extraHeaders || {}),
      };
      if (options.forwardAuthorization && req.headers?.authorization) {
        headers['Authorization'] = String(req.headers.authorization);
      }

      const method = (req.method || 'GET').toUpperCase();
      const fetchOptions: RequestInit = {
        method,
        headers,
      };
      if (
        method === 'POST' ||
        method === 'PUT' ||
        method === 'PATCH' ||
        (options.forwardBodyOnDelete && method === 'DELETE' && body.trim().length > 0)
      ) {
        const incomingContentType = String(req.headers?.['content-type'] || '').trim();
        headers['Content-Type'] =
          incomingContentType ||
          (method === 'PATCH' ? 'application/merge-patch+json' : 'application/json');
        fetchOptions.body = body || '{}';
      }

      const upstream = await fetch(targetUrl, fetchOptions);
      const contentType =
        upstream.headers.get('content-type') || 'application/json; charset=utf-8';
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', contentType);
      const disposition = upstream.headers.get('content-disposition');
      if (disposition) {
        res.setHeader('Content-Disposition', disposition);
      }

      if (upstream.status === 204) {
        res.end();
        return;
      }

      const bytes = new Uint8Array(await upstream.arrayBuffer());
      if (upstream.status === 429 && bytes.length === 0) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: `${providerLabel} rate limit reached. Please wait a few seconds and retry.`,
          })
        );
        return;
      }
      res.end(bytes);
    } catch {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Failed to reach ${providerLabel} upstream API` }));
    }
  };
}

function createQueryProxyMiddleware(
  upstreamUrl: string,
  defaultQuery: string,
  providerLabel: string
) {
  return async (req: DevRequest, res: DevResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    try {
      const rawUrl = String(req.url || '');
      const queryIndex = rawUrl.indexOf('?');
      const queryString = queryIndex !== -1 ? rawUrl.slice(queryIndex) : defaultQuery;
      const targetUrl = `${upstreamUrl}${queryString}`;

      const acceptHeader = req.headers?.accept;
      const upstream = await fetch(targetUrl, {
        method: req.method || 'GET',
        headers: {
          Accept:
            (Array.isArray(acceptHeader) ? acceptHeader[0] : acceptHeader) ||
            'application/json, */*',
          'User-Agent': PROXY_USER_AGENT,
        },
      });

      const contentType =
        upstream.headers.get('content-type') || 'application/json; charset=utf-8';
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', contentType);
      const disposition = upstream.headers.get('content-disposition');
      if (disposition) {
        res.setHeader('Content-Disposition', disposition);
      }

      const bytes = new Uint8Array(await upstream.arrayBuffer());
      res.end(bytes);
    } catch {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Failed to reach ${providerLabel} upstream API` }));
    }
  };
}

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
  const data = (await res.json()) as { token?: string };
  if (!data?.token) {
    throw new Error('DropMail token missing in response');
  }
  return data.token;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use('/api/vault', async (req: DevRequest, res: DevResponse) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const body = await readRequestBody(req);
          try {
            const parsed = JSON.parse(body || '{}') as { password?: unknown };
            const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';
            if (String(parsed.password || '') !== expectedPassword) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid vault password.' }));
              return;
            }

            const builtinPrivateApps: PrivateAppRecord[] = [
              {
                id: 'gameya-calc',
                title: 'حاسبة استثمار الجمعيات',
                description: 'حساب صافي ربح استثمار قبض الجمعية في صندوق عائد شهري مركب',
                url: '/gameya-calculator',
              },
            ];

            let envPrivateApps: PrivateAppRecord[] = [];
            if (process.env.PRIVATE_APPS_JSON) {
              try {
                const rawParsed: unknown = JSON.parse(process.env.PRIVATE_APPS_JSON);
                if (Array.isArray(rawParsed)) {
                  envPrivateApps = rawParsed as PrivateAppRecord[];
                }
              } catch {
                envPrivateApps = [];
              }
            }

            const existingIds = new Set(
              envPrivateApps
                .map((app) => app?.id || app?.url || app?.to)
                .filter((val): val is string => Boolean(val))
            );
            const apps = [
              ...builtinPrivateApps.filter(
                (b) => (!b.id || !existingIds.has(b.id)) && (!b.url || !existingIds.has(b.url))
              ),
              ...envPrivateApps,
            ];

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ unlocked: true, apps }));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid request payload.' }));
          }
        });

        server.middlewares.use(
          '/api/grabmail',
          createPathProxyMiddleware('https://grabmail.io/api/v1', '/domains', 'GrabMail')
        );

        server.middlewares.use(
          '/api/tempmail-io',
          createPathProxyMiddleware(
            'https://api.internal.temp-mail.io/api/v3',
            '/domains',
            'Temp-Mail.io',
            {
              extraHeaders: {
                Origin: 'https://temp-mail.io',
                Referer: 'https://temp-mail.io/',
                'Application-Name': 'webmail',
                'Application-Version': '4.0.0',
              },
              forwardBodyOnDelete: true,
              preserveAtInPath: true,
              defaultAccept: 'application/json',
            }
          )
        );

        server.middlewares.use(
          '/api/catchmail',
          createPathProxyMiddleware('https://api.catchmail.io/api/v1', '/mailbox', 'Catchmail.io')
        );

        server.middlewares.use(
          '/api/inboxes',
          createPathProxyMiddleware('https://inboxes.com/api/v2', '/domain', 'Inboxes.com')
        );

        server.middlewares.use(
          '/api/tempmail-lol',
          createPathProxyMiddleware('https://api.tempmail.lol', '/v3/inboxes', 'Tempmail.lol')
        );

        server.middlewares.use(
          '/api/tempmail-plus',
          createPathProxyMiddleware('https://tempmail.plus/api', '/mails/', 'TempMail.Plus')
        );

        server.middlewares.use('/api/dropmail', async (req: DevRequest, res: DevResponse) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const body = await readRequestBody(req);
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const rawHeaderToken = req.headers?.['x-dropmail-token'];
            const headerToken = Array.isArray(rawHeaderToken)
              ? rawHeaderToken[0]
              : rawHeaderToken;
            const providedToken = String(
              headerToken || urlObj.searchParams.get('token') || ''
            ).trim();
            let authToken = providedToken.startsWith('af_')
              ? providedToken
              : await mintDropmailToken();

            let upstream = await fetch(
              `https://dropmail.me/api/graphql/${encodeURIComponent(authToken)}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  'User-Agent': PROXY_USER_AGENT,
                },
                body: body || '{}',
              }
            );

            if ((upstream.status === 401 || upstream.status === 403) && providedToken) {
              authToken = await mintDropmailToken();
              upstream = await fetch(
                `https://dropmail.me/api/graphql/${encodeURIComponent(authToken)}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'User-Agent': PROXY_USER_AGENT,
                  },
                  body: body || '{}',
                }
              );
            }

            const contentType =
              upstream.headers.get('content-type') || 'application/json; charset=utf-8';
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Expose-Headers', 'X-Dropmail-Token');
            res.setHeader('X-Dropmail-Token', authToken);

            const bytes = new Uint8Array(await upstream.arrayBuffer());
            res.end(bytes);
          } catch {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to reach DropMail.me GraphQL API' }));
          }
        });

        server.middlewares.use(
          '/api/guerrilla',
          createQueryProxyMiddleware(
            'https://api.guerrillamail.com/ajax.php',
            '?f=get_email_address',
            'Guerrilla Mail'
          )
        );
      },
    },
  ],
});
