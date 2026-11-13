# Extending `ANOUS-SPACE`

This guide documents the `ProjectItem` schema in `src/data/projects.ts` and provides step-by-step checklists for registering an external showcase link or mounting a new self-contained internal module.

---

## 1. The `ProjectItem` Interface (`src/data/projects.ts`)

All cards displayed on the Hub Home (`/`) and indexed by `CommandPalette` conform to the `ProjectItem` interface defined in `src/data/projects.ts`:

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

## 2. Checklist: Registering an External Project Showcase

External project cards appear under the `All` and `Projects` tabs on the Hub Home and open in a new browser tab when selected.

- [ ] **Step 1**: Open `src/data/projects.ts`.
- [ ] **Step 2**: Append a new object to `PUBLIC_PROJECTS` with `type: 'external'`, `category: 'Projects'`, and `externalUrl` set to the target URL:

```ts
{
  id: 'analytics-platform',
  title: 'Real-Time Telemetry Platform',
  description: 'Event ingestion pipeline and multi-tenant analytics dashboard.',
  category: 'Projects',
  type: 'external',
  externalUrl: 'https://example.com',
  badge: 'Showcase',
  featured: false,
  keywords: ['analytics', 'telemetry', 'dashboard', 'web'],
}
```

---

## 3. Checklist: Mounting a New Internal Module

Internal modules live inside `src/projects/<module-name>/` and render within the application router.

- [ ] **Step 1: Create the isolated module directory**
  Create `src/projects/<module-name>/` containing your main page component and a module `README.md` (following the 4-section `Overview`, `Files`, `Routes & Endpoints`, and `Storage Keys` format).

- [ ] **Step 2: Integrate `AppHeader` and `recordRecentProject`**
  In your module's root component, render `AppHeader` from `../../shared/ui/AppHeader` and record the module visit on mount using `recordRecentProject('<module-id>')` from `../../shared/utils/recentTools`:

```tsx
import React, { useEffect } from 'react';
import { AppHeader } from '../../shared/ui/AppHeader';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface MyModulePageProps {
  onOpenCommandPalette: () => void;
}

export const MyModulePage: React.FC<MyModulePageProps> = ({ onOpenCommandPalette }) => {
  useEffect(() => {
    recordRecentProject('my-module');
  }, []);

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="My Module" />
      <main style={{ flex: 1 }}>
        {/* Module content */}
      </main>
    </div>
  );
};
```

- [ ] **Step 3: Register the module in `src/data/projects.ts`**
  Append a `ProjectItem` entry to `PUBLIC_PROJECTS` with `type: 'internal'` and `to: '/my-module'`:

```ts
{
  id: 'my-module',
  title: 'My Module Title',
  description: 'Concise summary of the module functionality.',
  category: 'Tools',
  type: 'internal',
  to: '/my-module',
  badge: 'Utility',
  keywords: ['custom', 'keyword', 'search'],
}
```

- [ ] **Step 4: Register the route in `src/App.tsx`**
  Import `MyModulePage` in `src/App.tsx` and add a `<Route>` entry inside `<Routes>`:

```tsx
<Route
  path="/my-module"
  element={<MyModulePage onOpenCommandPalette={openCommandPalette} />}
/>
```

- [ ] **Step 5: Add the module link to the root `README.md`**
  Add a row to the **Modules Index** table in `/README.md` linking to `./src/projects/<module-name>/README.md`.
