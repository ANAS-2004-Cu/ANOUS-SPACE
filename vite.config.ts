import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
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
  } = {}
) {
  return async (req: any, res: any) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    const body = await readRequestBody(req);
    try {
      const urlObj = new URL(req.url || '', 'http://localhost');
      const rawPath = urlObj.searchParams.get('path') || defaultPath;
      const safePath =
        rawPath.startsWith('/') && !rawPath.startsWith('//')
          ? rawPath
          : `/${rawPath.replace(/^\/+/, '')}`;
      const targetUrl = `${upstreamBase}${safePath}`;

      const headers: Record<string, string> = {
        Accept: req.headers?.accept || 'application/json, */*',
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
        headers['Content-Type'] = 'application/json';
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
  return async (req: any, res: any) => {
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

      const upstream = await fetch(targetUrl, {
        method: req.method || 'GET',
        headers: {
          Accept: req.headers?.accept || 'application/json, */*',
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

function createGraphqlProxyMiddleware(endpoint: string, providerLabel: string) {
  return async (req: any, res: any) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    const body = await readRequestBody(req);
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': PROXY_USER_AGENT,
        },
        body: body || '{}',
      });

      const contentType =
        upstream.headers.get('content-type') || 'application/json; charset=utf-8';
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', contentType);

      const bytes = new Uint8Array(await upstream.arrayBuffer());
      res.end(bytes);
    } catch {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Failed to reach ${providerLabel} GraphQL API` }));
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
        server.middlewares.use('/api/vault', async (req: any, res: any) => {
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
            const parsed = JSON.parse(body || '{}');
            const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';
            if (parsed.password !== expectedPassword) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid vault password.' }));
              return;
            }

            const defaultDevPrivateApps = [
              {
                id: 'gameya-calc',
                title: 'حاسبة استثمار الجمعيات',
                description: 'حساب صافي ربح استثمار قبض الجمعية في صندوق عائد شهري مركب',
                url: '/gameya-calculator',
              },
              {
                id: 'private-env-manager',
                title: 'Internal Config & Endpoints',
                description: 'Private workspace endpoints and deployment notes.',
                category: 'Private',
                type: 'internal',
                to: '/scratchpad',
                badge: 'Vault',
              },
            ];
            const apps = process.env.PRIVATE_APPS_JSON
              ? JSON.parse(process.env.PRIVATE_APPS_JSON)
              : defaultDevPrivateApps;

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
          '/api/mailtm',
          createPathProxyMiddleware('https://api.mail.tm', '/domains', 'Mail.tm', {
            forwardAuthorization: true,
          })
        );

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
              },
              forwardBodyOnDelete: true,
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

        server.middlewares.use('/api/dropmail', async (req: any, res: any) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const body = await readRequestBody(req);
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const providedToken = String(
              req.headers?.['x-dropmail-token'] || urlObj.searchParams.get('token') || ''
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
          '/api/maildrop',
          createGraphqlProxyMiddleware('https://api.maildrop.cc/graphql', 'Maildrop.cc')
        );

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
