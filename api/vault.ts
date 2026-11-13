declare const process: { env: Record<string, string | undefined> };

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const submittedPassword = String(body.password || '');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      res.status(503).json({
        error: 'Vault is not configured on this server (ADMIN_PASSWORD environment variable is not set).',
      });
      return;
    }

    if (submittedPassword !== adminPassword) {
      res.status(401).json({ error: 'Invalid vault password.' });
      return;
    }

    let privateApps: unknown[] = [];
    const rawPrivateApps = process.env.PRIVATE_APPS_JSON;
    if (rawPrivateApps) {
      try {
        const parsed = JSON.parse(rawPrivateApps);
        if (Array.isArray(parsed)) {
          privateApps = parsed;
        }
      } catch {
        privateApps = [];
      }
    }

    res.status(200).json({
      unlocked: true,
      apps: privateApps,
    });
  } catch {
    res.status(400).json({ error: 'Invalid request payload.' });
  }
}
