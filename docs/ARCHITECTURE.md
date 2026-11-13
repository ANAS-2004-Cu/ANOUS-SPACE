# Hub Architecture (`ANOUS-SPACE`)

This document specifies the internal architecture of the `ANOUS-SPACE` host shell, its shared context and UI primitives, its design tokens, and the strict module isolation boundary enforced across `src/projects/`.

---

## 1. Module Isolation Rule

`ANOUS-SPACE` enforces a strict boundary between the host shell and individual micro-applications:

1. **Self-Contained Modules**: Every internal tool or game resides in its own directory under `src/projects/<module-name>/` with its own components, services, and `README.md`.
2. **Forbidden Sibling Imports**: Modules inside `src/projects/<module-a>/` must **never** import files from `src/projects/<module-b>/`.
3. **Allowed Shared Imports**: Modules inside `src/projects/*` may import only from `src/shared/` (`AppHeader`, `Button`, `AlertContext`, `VaultContext`, `storage`, `clipboard`, `recentTools`).

```text
src/projects/<module-a>/  ──(ALLOWED)──►  src/shared/*
src/projects/<module-a>/  ──(BLOCKED)──►  src/projects/<module-b>/*
```

---

## 2. Routing & Application Shell (`src/App.tsx` & `src/pages/HubHome.tsx`)

- **`src/App.tsx`**: Wraps the application in `BrowserRouter`, `AlertProvider`, and `VaultProvider`. Registers a global `keydown` listener for `Ctrl+K` / `Cmd+K` to toggle `CommandPalette`, mounts `VaultModal`, and maps top-level routes to `HubHome` and each module in `src/projects/`.
- **`src/pages/HubHome.tsx`**: Reads public entries from `src/data/projects.ts` and merges them with `privateProjects` from `VaultContext` when the Vault is unlocked. Renders:
  - **Recent Bar**: Displays up to 3 recently visited internal modules resolved from `anous_recent_tools` (`src/shared/utils/recentTools.ts`).
  - **Category Filter Tabs**: Filters the grid by `All`, `Tools`, `Games`, `Projects`, and `Private` (visible only when unlocked).
  - **Bento Grid**: Renders cards that either navigate to internal routes (`item.to`) or open external showcase URLs (`item.externalUrl`) in a new tab.

---

## 3. Shared Contexts & UI Primitives (`src/shared/`)

### `VaultContext` (`src/shared/context/VaultContext.tsx`) & `VaultModal` (`src/shared/ui/VaultModal.tsx`)
- Manages authentication state (`isUnlocked`), normalized private project items (`privateProjects`), and modal visibility (`vaultModalOpen`).
- Sends `POST /api/vault` with `{ password }`. Upon verification, normalizes the returned array into `ProjectItem[]` entries under category `'Private'` and stores `{ unlocked: true, projects }` in `window.sessionStorage['anous_vault_session']`.
- Because state is stored in `sessionStorage`, closing the browser tab automatically clears the session and locks the Vault.

### `AlertContext` (`src/shared/context/AlertContext.tsx`) & `AlertModal` (`src/shared/ui/AlertModal.tsx`)
- Exposes `useAlert().showAlert(title, message, actions)` for imperative confirmation and notification modals.
- Supports action styles `'default'`, `'cancel'`, and `'destructive'`.

### `CommandPalette` (`src/shared/ui/CommandPalette.tsx`)
- Modal search interface accessible via `Ctrl+K` / `Cmd+K` or the `Search` button in `AppHeader`.
- Filters `PUBLIC_PROJECTS` (plus `privateProjects` when unlocked) across `title`, `description`, `category`, `badge`, and `keywords`.
- Supports keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) and touch selection.
- Typing the exact keyword `"vault"` reveals an action item to open `VaultModal`.

### `AppHeader` (`src/shared/ui/AppHeader.tsx`)
- Renders the top navigation bar across the Hub and all internal modules.
- Displays a back-to-hub button (`<-`) when `location.pathname !== '/'`, the `ANAS GAMAL` title, and an optional module `subtitle`.
- Holding pointer press on `ANAS GAMAL` for 2000ms triggers `openVaultModal()`.

---

## 4. Design Tokens (`src/styles/global.css`)

All shell views and modules share a matte dark palette defined as CSS custom properties in `src/styles/global.css`:

| CSS Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-app` | `#0E1015` | Application background and inset inputs |
| `--bg-surface` | `#161922` | Cards, modals, and panels |
| `--bg-elevated` | `#1C202B` | Active command palette row and elevated elements |
| `--border-subtle` | `#252A37` | Default `1px solid` card and section borders |
| `--border-hover` | `#363D4F` | Interactive card hover border |
| `--text-primary` | `#F3F4F6` | Headings and primary body text |
| `--text-secondary` | `#9CA3AF` | Descriptions and secondary labels |
| `--text-muted` | `#6B7280` | Metadata, badges, and subtle hints |
| `--accent` | `#3B82F6` | Primary buttons, active tabs, and focus accents |
| `--danger` | `#EF4444` | Destructive actions and error states |
| `--success` | `#10B981` | Positive validation and completion states |
| `--font-sans` | `'Inter', system-ui, sans-serif` | Primary UI typography |
| `--font-mono` | `'JetBrains Mono', monospace` | Code, counters, email addresses, and shortcut badges |
