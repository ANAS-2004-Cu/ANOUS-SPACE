# Developer Playbook: Extending `ANOUS-SPACE`

[![Registry](https://img.shields.io/badge/Registry-src%2Fdata%2Fprojects.ts-3B82F6?style=flat-square)](#1-the-projectitem-schema)
[![Router](https://img.shields.io/badge/Router-src%2FApp.tsx-10B981?style=flat-square)](#3-mounting-a-new-public-internal-module)
[![Vault](https://img.shields.io/badge/Vault-Guarded_Private_Modules-F43F5E?style=flat-square)](#4-mounting-a-vault-guarded-private-module)

This playbook provides copy-paste-ready patterns for registering external project showcases, mounting new public internal modules, or adding restricted Private Vault micro-apps.

---

## 1. The `ProjectItem` Schema

All cards rendered in the Hub Bento Grid (`/`) and indexed by `CommandPalette` (`Ctrl+K`) implement the `ProjectItem` interface in `src/data/projects.ts`:

```ts
export type ProjectCategory = 'Tools' | 'Games' | 'Projects' | 'Private';

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  type: 'internal' | 'external';
  to?: string;
  externalUrl?: string;
  badge?: string;
  featured?: boolean;
  keywords?: string[];
}
```

---

## 2. Registering an External Project Showcase

External project cards appear under the `All` and `Projects` tabs on the Hub Home (spanning 2 columns on desktop) and open in a new browser tab.

1. Open `src/data/projects.ts`.
2. Append a new entry to `PUBLIC_PROJECTS` with `category: 'Projects'` and `type: 'external'`:

```ts
{
  id: 'telemetry-cloud',
  title: 'Real-Time Telemetry Cloud',
  description: 'High-throughput event ingestion pipeline and multi-tenant observability dashboard.',
  category: 'Projects',
  type: 'external',
  externalUrl: 'https://example.com',
  badge: 'Showcase',
  featured: true,
  keywords: ['telemetry', 'analytics', 'cloud', 'showcase'],
}
```

---

## 3. Mounting a New Public Internal Module

Public internal modules live in `src/projects/<module-name>/` and are accessible to all visitors.

> [!IMPORTANT]
> **Architectural Guardrail**: Every module inside `src/projects/<module-name>/` must import **only** from `src/shared/` (never from sibling directories in `src/projects/*`) and must include its own `README.md` following the 4-section module blueprint (`Overview`, `Files`, `Routes & Endpoints`, `Storage Keys`).

### Step 1 — Create the Module Component (`src/projects/<module-name>/MyModulePage.tsx`)

Wrap the module in `.route-theme-canvas` (for custom dark/light background atmosphere) and `.workspace-shell`, include `<AppHeader />`, and register the visit via `recordRecentProject`:

```tsx
import React, { useEffect } from 'react';
import { AppHeader } from '../../shared/ui/AppHeader';
import { useTheme } from '../../shared/context/ThemeContext';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface MyModulePageProps {
  onOpenCommandPalette: () => void;
}

export const MyModulePage: React.FC<MyModulePageProps> = ({ onOpenCommandPalette }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    recordRecentProject('my-module');
  }, []);

  return (
    <div
      className="route-theme-canvas"
      style={{ backgroundColor: isLight ? '#F4F6FA' : '#0B0F19' }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="My Module" />
        <main style={{ flex: 1 }}>
          {/* Module UI */}
        </main>
      </div>
    </div>
  );
};
```

### Step 2 — Register in `PUBLIC_PROJECTS` (`src/data/projects.ts`)

```ts
{
  id: 'my-module',
  title: 'My Custom Utility',
  description: 'One-line explanation of what this utility solves.',
  category: 'Tools',
  type: 'internal',
  to: '/my-module',
  badge: 'Utility',
  keywords: ['utility', 'custom', 'tool'],
}
```

### Step 3 — Mount the Route (`src/App.tsx`) & Link Module Docs (`README.md`)

Add the `<Route path="/my-module" ... />` entry in `src/App.tsx`, create `src/projects/my-module/README.md`, and add a row to the **Public Modules Index** table in the root `README.md`.

---

## 4. Mounting a Vault-Guarded Private Module

When building a private internal tool that must remain invisible to public visitors:

1. **Create the isolated module** in `src/projects/<private-module>/` with its own 4-section `README.md`.
2. **Do NOT add it to `PUBLIC_PROJECTS`** in `src/data/projects.ts` and **do NOT list it in the root `README.md`**.
3. **Wrap the route in `<VaultGuard>`** inside `src/App.tsx`:

```tsx
<Route
  path="/my-private-tool"
  element={
    <VaultGuard>
      <MyPrivateToolPage onOpenCommandPalette={openCommandPalette} />
    </VaultGuard>
  }
/>
```

4. **Include the route descriptor** (`{ id, title, description, url: '/my-private-tool' }`) in the `/api/vault` response payload so it appears automatically in the `Private` tab and `CommandPalette` whenever the Vault session is unlocked.
