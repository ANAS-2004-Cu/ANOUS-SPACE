declare const process: { env: Record<string, string | undefined> };

interface ApiRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    end(): void;
    json(payload: unknown): void;
    send(payload: unknown): void;
  };
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
    const body = (
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    ) as { password?: unknown };
    const submittedPassword = String(body.password || '');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      res.status(503).json({
        error:
          'Vault is not configured on this server (ADMIN_PASSWORD environment variable is not set).',
      });
      return;
    }

    if (submittedPassword !== adminPassword) {
      res.status(401).json({ error: 'Invalid vault password.' });
      return;
    }

    const builtinPrivateApps: PrivateAppRecord[] = [
      {
        id: 'gameya-calc',
        title: 'حاسبة استثمار الجمعيات',
        description: 'حساب صافي ربح استثمار قبض الجمعية في صندوق عائد شهري مركب',
        url: '/gameya-calculator',
      },
      {
        id: 'invoice-studio',
        title: 'استوديو عروض الأسعار',
        description: 'إنشاء وإدارة عروض الأسعار مع الأرشفة وتصدير PDF و PNG وطباعة A4',
        url: '/invoice-studio',
      },
    ];

    let envPrivateApps: PrivateAppRecord[] = [];
    const rawPrivateApps = process.env.PRIVATE_APPS_JSON;
    if (rawPrivateApps) {
      try {
        const parsed: unknown = JSON.parse(rawPrivateApps);
        if (Array.isArray(parsed)) {
          envPrivateApps = parsed as PrivateAppRecord[];
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
    const mergedApps = [
      ...builtinPrivateApps.filter(
        (b) => (!b.id || !existingIds.has(b.id)) && (!b.url || !existingIds.has(b.url))
      ),
      ...envPrivateApps,
    ];

    res.status(200).json({
      unlocked: true,
      apps: mergedApps,
    });
  } catch {
    res.status(400).json({ error: 'Invalid request payload.' });
  }
}
