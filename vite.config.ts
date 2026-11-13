import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use('/api/vault', (req: any, res: any) => {
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

          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
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
        });

        server.middlewares.use('/api/tempmail-lol', (req: any, res: any) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost');
              const endpoint = urlObj.searchParams.get('endpoint') || '/v2/inbox';
              const token = urlObj.searchParams.get('token');
              const targetUrl = token
                ? `https://api.tempmail.lol${endpoint}?token=${encodeURIComponent(token)}`
                : `https://api.tempmail.lol${endpoint}`;

              const fetchOptions: RequestInit = {
                method: req.method || 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  'User-Agent': 'Mozilla/5.0 (compatible; AnousSpace/1.0)',
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
        });
      },
    },
  ],
  server: {
    proxy: {
      '/api/guerrilla': {
        target: 'https://api.guerrillamail.com/ajax.php',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/guerrilla/, ''),
      },
      '/api/maildrop': {
        target: 'https://api.maildrop.cc/graphql',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/maildrop/, ''),
      },
    },
  },
});
