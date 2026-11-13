import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

const PROXY_USER_AGENT = 'Mozilla/5.0 (compatible; AnousSpace/1.0)';

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
  forwardAuthorization: boolean = false
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
        Accept: req.headers?.accept || 'application/json',
        'User-Agent': PROXY_USER_AGENT,
      };
      if (forwardAuthorization && req.headers?.authorization) {
        headers['Authorization'] = String(req.headers.authorization);
      }

      const fetchOptions: RequestInit = {
        method: req.method || 'GET',
        headers,
      };
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = body || '{}';
      }

      const upstream = await fetch(targetUrl, fetchOptions);
      const contentType =
        upstream.headers.get('content-type') || 'application/json; charset=utf-8';
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', contentType);

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
          createPathProxyMiddleware('https://api.mail.tm', '/domains', 'Mail.TM', true)
        );

        server.middlewares.use(
          '/api/mailgw',
          createPathProxyMiddleware('https://api.mail.gw', '/domains', 'Mail.gw', true)
        );

        server.middlewares.use(
          '/api/inboxes',
          createPathProxyMiddleware('https://inboxes.com/api/v2', '/domain', 'Inboxes.com')
        );

        server.middlewares.use(
          '/api/tempmail-plus',
          createPathProxyMiddleware('https://tempmail.plus/api', '/mails', 'TempMail.Plus')
        );

        server.middlewares.use('/api/tempmail-lol', async (req: any, res: any) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const body = await readRequestBody(req);
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const rawEndpoint = urlObj.searchParams.get('endpoint') || '/v2/inbox';
            const safeEndpoint =
              rawEndpoint.startsWith('/') && !rawEndpoint.startsWith('//')
                ? rawEndpoint
                : `/${rawEndpoint.replace(/^\/+/, '')}`;
            const token = urlObj.searchParams.get('token');
            const targetUrl = token
              ? `https://api.tempmail.lol${safeEndpoint}?token=${encodeURIComponent(token)}`
              : `https://api.tempmail.lol${safeEndpoint}`;

            const fetchOptions: RequestInit = {
              method: req.method || 'GET',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'User-Agent': PROXY_USER_AGENT,
              },
            };
            if (req.method === 'POST') {
              fetchOptions.body = body || '{}';
            }

            const upstream = await fetch(targetUrl, fetchOptions);
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(text);
          } catch {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to reach TempMail.lol upstream API' }));
          }
        });

        server.middlewares.use('/api/guerrilla', async (req: any, res: any) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          try {
            const queryIndex = req.url?.indexOf('?') ?? -1;
            const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
            const targetUrl = `https://api.guerrillamail.com/ajax.php${queryString}`;
            const upstream = await fetch(targetUrl, {
              method: req.method || 'GET',
              headers: {
                Accept: 'application/json',
                'User-Agent': PROXY_USER_AGENT,
              },
            });
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(text);
          } catch {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to reach GuerrillaMail upstream API' }));
          }
        });

        server.middlewares.use('/api/maildrop', async (req: any, res: any) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const body = await readRequestBody(req);
          try {
            const upstream = await fetch('https://api.maildrop.cc/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'User-Agent': PROXY_USER_AGENT,
              },
              body: body || '{}',
            });
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(text);
          } catch {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to reach Maildrop GraphQL API' }));
          }
        });
      },
    },
  ],
});
