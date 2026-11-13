# Developer Playbook: Extending `ANOUS-SPACE`

[![Registry](https://img.shields.io/badge/Registry-src%2Fdata%2Fprojects.ts-3B82F6?style=flat-square)](#1-the-projectitem-interface-srcdataprojectsts)
[![Router](https://img.shields.io/badge/Router-src%2FApp.tsx-10B981?style=flat-square)](#3-mounting-a-new-public-internal-module)
[![Vault](https://img.shields.io/badge/Vault-VaultGuard_Routes-F43F5E?style=flat-square)](#4-mounting-a-vault-guarded-private-module)

This guide documents the exact TypeScript interfaces and step-by-step patterns for adding an external project showcase, mounting a public internal micro-app, or protecting a private internal module behind `<VaultGuard>`.

---

## 1. The `ProjectItem` Interface (`src/data/projects.ts`)

Every card rendered on `HubHome` (`/`) and indexed by `CommandPalette` (`Ctrl+K`) conforms to `ProjectItem`:

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

| Field | Type | Behavior in `HubHome` & `CommandPalette` |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier; used as React `key`, icon/artwork switch key in `HubHome.tsx`, and ID stored in `anous_recent_tools`. |
| `category` | `ProjectCategory` | Determines filter tab placement and card accent color (`Tools` slate blue `#5B82B8`, `Games` sage `#51A37D`, `Projects` ochre `#C5954E`, `Private` terracotta `#C26A58`). |
| `type` | `'internal' \| 'external'` | `'internal'` navigates via React Router (`navigate(item.to)`); `'external'` opens `item.externalUrl` in a new tab (`window.open(..., '_blank', 'noopener,noreferrer')`). |
| `featured` | `boolean` (optional) | When `true` (or when `category === 'Projects'`), applies `.bento-card-featured` (spanning 2 grid columns on screens `>= 720px`). |
| `keywords` | `string[]` (optional) | Additional search tokens matched by `CommandPalette`. |

---

## 2. Adding an External Project Showcase Card

1. Open `src/data/projects.ts`.
2. Append a new entry to `PUBLIC_PROJECTS` with `category: 'Projects'` and `type: 'external'`:

```ts
{
  id: 'cloud-status-monitor',
  title: 'Distributed Uptime & Latency Monitor',
  description: 'Multi-region synthetic health checks, incident timelines, and webhook alerting.',
  category: 'Projects',
  type: 'external',
  externalUrl: 'https://github.com/ANAS-2004-Cu',
  badge: 'Showcase',
  featured: true,
  keywords: ['uptime', 'monitoring', 'status', 'cloud'],
}
```

---

## 3. Mounting a New Public Internal Module

> [!IMPORTANT]
> **Module Isolation & Documentation Guardrails**:
> - Place all module code inside `src/projects/<module-name>/`.
> - Import shared primitives **only** from `src/shared/` (never from sibling directories in `src/projects/*`).
> - Create `src/projects/<module-name>/README.md` following the 4-section blueprint (`## Overview`, `## Files`, `## Routes & Endpoints`, `## Storage Keys`).

### Step 1 — Create the Module View (`src/projects/<module-name>/MyModulePage.tsx`)

Wrap the page in `.route-theme-canvas` (to give the tool its own dark/light background atmosphere) and `.workspace-shell`, render `<AppHeader />`, and call `recordRecentProject('<module-id>')` on mount:

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
      style={{ backgroundColor: isLight ? '#F7F7F5' : '#121316' }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="My Module" />
        <main style={{ flex: 1 }}>
          {/* Module interface */}
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
  title: 'My Utility Title',
  description: 'Concise description of what the utility does.',
  category: 'Tools',
  type: 'internal',
  to: '/my-module',
  badge: 'Utility',
  featured: false,
  keywords: ['utility', 'tool'],
}
```

### Step 3 — Mount the Route (`src/App.tsx`) & Index the Module (`README.md`)

1. Import `MyModulePage` in `src/App.tsx` and add `<Route path="/my-module" element={<MyModulePage onOpenCommandPalette={openCommandPalette} />} />`.
2. Add a row to the **Public Modules Index** table in the root `README.md` linking to `./src/projects/<module-name>/README.md`.

---

## 4. Mounting a Vault-Guarded Private Module

When creating a restricted internal module that must remain invisible to unauthenticated visitors:

1. **Create the isolated directory** at `src/projects/<private-module>/` with its component(s) and 4-section `README.md`.
2. **Omit from Public Files**: Do **not** add the module to `PUBLIC_PROJECTS` in `src/data/projects.ts`, do **not** call `recordRecentProject`, and do **not** list it in the public root `README.md`.
3. **Wrap the Route in `<VaultGuard>` (`src/App.tsx`)**:

```tsx
<Route
  path="/private-tool"
  element={
    <VaultGuard>
      <PrivateToolPage onOpenCommandPalette={openCommandPalette} />
    </VaultGuard>
  }
/>
```

4. **Return the Route Descriptor from `/api/vault`**: Include `{ id, title, description, url: '/private-tool' }` in `api/vault.ts` (and `vite.config.ts` dev middleware). `VaultContext` automatically normalizes any `url` starting with `/` as `type: 'internal'` and `category: 'Private'`, surfacing it in the `Private` tab and `CommandPalette` only while the Vault session is unlocked.
