import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-vault-api-dev-middleware',
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
