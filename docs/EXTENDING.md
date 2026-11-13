# Extending `ANOUS-SPACE`

This guide explains how to add new external project showcases, build new self-contained internal micro-apps, and configure private entries inside the Private Vault.

---

## 1. Adding an External Showcase Project

External showcase projects appear on the Hub Home (`/`) under `All` and `Projects` (and in `CommandPalette` search results) and open an external URL in a new browser tab when clicked.

You only need to edit **one file**: `src/data/projects.ts`.

### Step-by-Step

Open `src/data/projects.ts` and append a new `ProjectItem` object with `type: 'external'` and `category: 'Projects'` to `PUBLIC_PROJECTS`:

```ts
// src/data/projects.ts
{
  id: 'my-saas-platform',
  title: 'Real-Time Analytics Dashboard',
  description:
    'Event ingestion pipeline and multi-tenant telemetry dashboard built with Next.js and ClickHouse.',
  category: 'Projects',
  type: 'external',
  externalUrl: 'https://analytics.example.com',
  badge: 'Production',
  featured: false, // Set to true to span 2 columns on desktop Bento grids
  keywords: ['analytics', 'dashboard', 'saas', 'clickhouse', 'nextjs'],
}
```

Card clicks automatically open `externalUrl` with `window.open(url, '_blank', 'noopener,noreferrer')` and display the `Live Demo` action footer.

---

## 2. Adding a New Self-Contained Internal Micro-App

Adding an internal tool or game involves **three steps**:

### Step 1: Create the Feature Directory (`src/projects/<feature-name>/`)

Create a new directory under `src/projects/` containing your page component and a local `README.md`:

```text
src/projects/jwt-debugger/
├── JwtDebuggerPage.tsx
└── README.md
```

Use `AppHeader` and `recordRecentProject` inside your page component so navigation, the 2-second Vault trigger, `Ctrl+K` search, and the Hub `Recent` bar work automatically:

```tsx
// src/projects/jwt-debugger/JwtDebuggerPage.tsx
import React, { useEffect } from 'react';
import { AppHeader } from '../../shared/ui/AppHeader';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface JwtDebuggerPageProps {
  onOpenCommandPalette: () => void;
}

export const JwtDebuggerPage: React.FC<JwtDebuggerPageProps> = ({ onOpenCommandPalette }) => {
  useEffect(() => {
    recordRecentProject('jwt-debugger');
  }, []);

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="JWT Debugger" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Feature UI */}
      </main>
    </div>
  );
};
```

### Step 2: Register Metadata in `src/data/projects.ts`

Add an entry with `type: 'internal'` and `to: '/jwt-debugger'` to `PUBLIC_PROJECTS`:

```ts
// src/data/projects.ts
{
  id: 'jwt-debugger',
  title: 'JWT Inspector & Decoder',
  description: 'Client-side JSON Web Token header and payload decoder with expiration checks.',
  category: 'Tools', // 'Tools' | 'Games' | 'Projects'
  type: 'internal',
  to: '/jwt-debugger',
  badge: 'Security',
  keywords: ['jwt', 'token', 'auth', 'decode', 'base64'],
}
```

### Step 3: Mount the Route in `src/App.tsx`

Import your page component in `src/App.tsx` and register its `<Route>` inside `<Routes>`:

```tsx
// src/App.tsx
import { JwtDebuggerPage } from './projects/jwt-debugger/JwtDebuggerPage';

// Inside <Routes>:
<Route
  path="/jwt-debugger"
  element={<JwtDebuggerPage onOpenCommandPalette={openCommandPalette} />}
/>
```

---

## 3. Adding Private Vault Entries (`PRIVATE_APPS_JSON`)

Private Vault items are **never** hardcoded in `src/data/projects.ts`. Instead, they are supplied at runtime by `/api/vault` from the `PRIVATE_APPS_JSON` environment variable in Vercel.

Set `PRIVATE_APPS_JSON` in your Vercel project settings to a valid JSON array. Each item supports either an external `url` or an internal `to` route:

```json
[
  {
    "id": "staging-dashboard",
    "title": "Staging Infrastructure Console",
    "description": "Private staging cluster metrics and deployment controls.",
    "url": "https://staging-internal.example.com",
    "badge": "Infra"
  },
  {
    "id": "private-scratchpad",
    "title": "Internal Scratchpad",
    "description": "Direct link to workspace scratchpad.",
    "to": "/scratchpad",
    "badge": "Internal"
  }
]
```

---

## 4. UI & Styling Guidelines for New Modules

When building new components inside `ANOUS-SPACE`, adhere to the core design tokens in `src/styles/global.css`:

- **Backgrounds**: Use `#0E1015` (`var(--bg-app)`) for the page background and deep inset inputs, and `#161922` (`var(--bg-surface)`) for cards and panels.
- **Borders**: Use `1px solid #252A37` (`var(--border-subtle)`) with `#363D4F` (`var(--border-hover)`) on interactive hover states.
- **Accent Color**: Reserve `#3B82F6` (`var(--accent)`) for primary action buttons, active tab indicators, and focused interactive states.
- **Typography**: Apply `className="mono"` (`JetBrains Mono`) to all code editors, numeric counters, timestamps, email addresses, and keyboard shortcut badges.
- **Restraint**: Do not introduce background images, backdrop blur filters, neon drop-shadows, decorative gradients, or emojis in UI copy.
