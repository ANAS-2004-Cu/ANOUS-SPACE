# Architecture & System Design (`ANOUS-SPACE`)

This document describes the structural design of `ANOUS-SPACE`, including its feature-based isolation model, shared UI/utility layer, hybrid Command Palette, Private Vault authentication lifecycle, and serverless API proxy layer.

---

## 1. Feature-Based Isolation Pattern

Rather than grouping files by technical type across the entire application (e.g., placing all components or services from unrelated games and tools into a single global folder), `ANOUS-SPACE` isolates every internal mini-application inside `src/projects/<feature-name>/`.

```text
src/
├── data/projects.ts          # Central metadata registry (IDs, routes, categories, search keywords)
├── pages/HubHome.tsx         # Root hub view consuming src/data/projects.ts
├── shared/                   # Strictly cross-cutting UI primitives, contexts, and browser utilities
└── projects/                 # Self-contained feature modules
    ├── scratchpad/
    ├── temp-mail/
    ├── tic-tac-toe/
    └── guess-game/
```

### Architectural Rules
1. **No Cross-Project Imports**: A module under `src/projects/A` never imports files from `src/projects/B`.
2. **Shared Primitives Only**: Feature modules consume common chrome (`AppHeader`, `Button`), dialogs (`useAlert`), and browser wrappers (`storage.ts`, `clipboard.ts`, `recentTools.ts`) exclusively from `src/shared/`.
3. **Self-Contained Domain Logic**: API clients, modals, and sub-routes specific to a single tool (such as `tempMailService.ts` and `DomainSelectModal.tsx` inside `src/projects/temp-mail/`) remain co-located within that feature directory.

---

## 2. Shared UI, Context & Utility Layer (`src/shared/`)

### UI Components (`src/shared/ui/`)
- **`AppHeader.tsx`**: Renders the top workspace bar across all routes.
  - Displays a back-to-hub button (`<-`) whenever `location.pathname !== '/'`, followed by `ANAS GAMAL` and an optional breadcrumb `subtitle`.
  - Attaches pointer event handlers (`onPointerDown`, `onPointerUp`, `onPointerLeave`, `onPointerCancel`) to `ANAS GAMAL` to detect a **2-second continuous press**, which opens `VaultModal` without cluttering the public interface.
  - Displays a `Vault` status pill when the Private Vault is unlocked and a `Search` (`Ctrl K`) trigger button on the right.
- **`Button.tsx`**: Standardized button component supporting four visual variants (`primary`, `secondary`, `ghost`, `danger`), three sizes (`sm`, `md`, `lg`), and an inline loading spinner.
- **`AlertModal.tsx` & `AlertContext.tsx`**: Provides an imperative `useAlert().showAlert(title, message, actions)` hook that replaces browser `window.alert`/`window.confirm` with a keyboard- and touch-friendly modal supporting `default`, `cancel`, and `destructive` action buttons.

### Browser Utilities (`src/shared/utils/`)
- **`storage.ts`**: Async-compatible wrapper (`getItemAsync`, `setItemAsync`, `deleteItemAsync`) around `window.localStorage` with `try/catch` guards for private browsing or quota limits.
- **`clipboard.ts`**: Copies text via `navigator.clipboard.writeText` with an automatic hidden `<textarea>` + `document.execCommand('copy')` fallback.
- **`recentTools.ts`**: Persists the ordered list of up to 3 recently visited internal project IDs under `localStorage['anous_recent_tools']`. Each internal workspace calls `recordRecentProject('<id>')` on mount so the Hub Home `Recent` bar stays up to date whether a user navigates via a card, the Command Palette, or a direct URL.

---

## 3. Hybrid Command Palette (`Ctrl+K` & Mobile Search)

Implemented in `src/shared/ui/CommandPalette.tsx` and mounted globally in `src/App.tsx`:

- **Activation**:
  - **Desktop**: Pressing `Ctrl+K` or `Cmd+K` anywhere in the application toggles the palette via a global `keydown` listener in `App.tsx`.
  - **Mobile / Pointer**: Clicking the `Search` button in `AppHeader` opens the same modal.
- **Search Indexing**:
  - Combines `PUBLIC_PROJECTS` from `src/data/projects.ts` with `privateProjects` from `VaultContext` (when unlocked).
  - Filters items in real time across `title`, `description`, `category`, `badge`, and `keywords`.
- **Keyboard & Touch Ergonomics**:
  - `ArrowDown` / `ArrowUp` cycle through results; `Enter` opens the selected item (navigating internally and recording the visit in `recentTools.ts`, or opening external URLs in a new tab); `Escape` closes the modal.
- **Vault Keyword Trigger**:
  - Typing the exact query `"vault"` surfaces a dedicated action banner (`Unlock Private Vault` or `Manage Private Vault`), allowing keyboard users to open `VaultModal` by pressing `Enter`.

---

## 4. Private Vault Session Flow

The Private Vault keeps restricted tools and deployment URLs out of the client bundle:

```text
[User triggers Vault]
  ├── Method A: Type "vault" in CommandPalette + Enter
  └── Method B: Long-press "ANAS GAMAL" in AppHeader for 2000ms
         │
         ▼
[VaultModal opens] ──► POST /api/vault { password }
                             │
         ┌───────────────────┴───────────────────┐
         ▼ (401 Unauthorized)                    ▼ (200 OK)
[Display inline error]            [Returns { unlocked: true, apps: [...] }]
                                                 │
                                                 ▼
                                  [VaultContext normalizes apps into ProjectItem[]]
                                  [Persists to sessionStorage['anous_vault_session']]
                                                 │
                                                 ▼
                                  [HubHome reveals "Private" tab & private cards]
```

- **Server-Side Verification (`api/vault.ts`)**: Compares the submitted password against `process.env.ADMIN_PASSWORD`. Only upon a match does the server parse and return `process.env.PRIVATE_APPS_JSON`.
- **Session Persistence (`VaultContext.tsx`)**: Unlocked state and normalized `ProjectItem[]` entries are stored in `window.sessionStorage` (`anous_vault_session`). Refreshing the tab preserves the unlocked session, whereas closing the browser tab/window automatically purges `sessionStorage` and locks the Vault.Users can also manually lock the Vault at any time from `VaultModal`.

---

## 5. Serverless Proxy Layer (`/api/*` & Vite Dev Server)

Third-party disposable email providers (`GuerrillaMail`, `Maildrop.cc`, `TempMail.lol`) either lack browser CORS headers or require server-to-server requests.

- **Production (Vercel)**: Requests to `/api/guerrilla`, `/api/maildrop`, and `/api/tempmail-lol` are handled by the serverless functions in `/api/*.ts`, which forward the request to the upstream API and attach permissive CORS response headers.
- **Local Development (`vite.config.ts`)**: Vite's development server proxies `/api/guerrilla` and `/api/maildrop` directly via `server.proxy` and runs custom Connect middleware for `/api/vault` and `/api/tempmail-lol`, ensuring identical behavior between `npm run dev` and production deployments on Vercel.
