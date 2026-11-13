# ANOUS-SPACE

ANOUS-SPACE is a modular personal workspace and engineering hub built with React, TypeScript, and Vite. It consolidates self-contained developer utilities, interactive board and logic games, external project showcases, and an environment-backed Private Vault behind a unified matte dark interface and global command palette.

---

## Overview

The application is structured around feature isolation:

- **Hub Shell (`/`)**: Provides category filtering (`All`, `Tools`, `Games`, `Projects`, and `Private`), a persistent Recent Bar tracking the last 3 opened internal workspaces, a Bento grid layout, and a keyboard/touch Command Palette (`Ctrl+K`).
- **Self-Contained Internal Workspaces (`src/projects/*`)**: Each internal tool or game lives in its own directory under `src/projects/` with dedicated state, services, and documentation while sharing the core header, modal, storage, and clipboard primitives.
- **Environment-Backed Private Vault (`/api/vault`)**: Authenticates against server-side environment variables (`ADMIN_PASSWORD` and `PRIVATE_APPS_JSON`) to unlock restricted tools and links for the duration of the browser tab session (`sessionStorage`).
- **Serverless CORS Proxies (`/api/*`)**: Vercel serverless functions (mirrored in Vite local development middleware/proxies) mediate third-party API requests for disposable email providers.

---

## Repository Directory Tree

```text
ANOUS-SPACE/
├── api/                                      # Vercel Serverless Functions (Node.js runtime)
│   ├── guerrilla.ts                          # CORS proxy for GuerrillaMail AJAX API
│   ├── maildrop.ts                           # CORS proxy for Maildrop.cc GraphQL API
│   ├── tempmail-lol.ts                       # CORS proxy for TempMail.lol REST v2 API
│   └── vault.ts                              # Password verification & private app registry endpoint
├── docs/                                     # Engineering & architectural documentation
│   ├── ARCHITECTURE.md                       # Feature isolation, shared layer, Command Palette, and Vault flow
│   └── EXTENDING.md                          # Step-by-step guide to adding tools and external showcases
├── public/
│   └── favicon.png                           # Application favicon
├── src/
│   ├── data/
│   │   └── projects.ts                       # Single source of truth for public tools, games, and showcases
│   ├── pages/
│   │   └── HubHome.tsx                       # Root dashboard (/): Recent Bar, category tabs, and Bento grid
│   ├── projects/                             # Self-contained internal micro-applications
│   │   ├── guess-game/
│   │   │   ├── GuessGamePage.tsx             # 0–99 numeric deduction game with proximity telemetry
│   │   │   └── README.md                     # Module documentation for Number Guess
│   │   ├── scratchpad/
│   │   │   ├── ScratchpadPage.tsx            # Auto-saving editor, JSON formatter/validator, and Blob file exporter
│   │   │   └── README.md                     # Module documentation for Quick Scratchpad & File Maker
│   │   ├── temp-mail/
│   │   │   ├── DomainSelectModal.tsx         # Domain picker modal for Mail.TM and GuerrillaMail
│   │   │   ├── EmailDetailPage.tsx           # Message viewer (sandboxed HTML iframe / plain text / attachments)
│   │   │   ├── GuerrillaInboxPage.tsx        # Session-managed inbox for GuerrillaMail
│   │   │   ├── TempMailHubPage.tsx           # 4-provider account creator and switcher
│   │   │   ├── TempMailInboxPage.tsx         # Unified inbox for Mail.TM, TempMail.lol, and Maildrop.cc
│   │   │   ├── tempMailService.ts            # Multi-provider API client, token hydration, and local cache
│   │   │   └── README.md                     # Module documentation for Temp-Mail Suite
│   │   └── tic-tac-toe/
│   │       ├── TicTacToePage.tsx             # Segmented Classic 3x3 and FIFO 3-Marker Tic-Tac-Toe workspace
│   │       └── README.md                     # Module documentation for Tic-Tac-Toe
│   ├── shared/                               # Cross-cutting UI primitives, contexts, and browser utilities
│   │   ├── context/
│   │   │   ├── AlertContext.tsx              # Imperative modal alert provider (useAlert)
│   │   │   └── VaultContext.tsx              # Session-scoped Private Vault state provider (useVault)
│   │   ├── ui/
│   │   │   ├── AlertModal.tsx                # Accessible dialog component rendered by AlertContext
│   │   │   ├── AppHeader.tsx                 # Global header with 2s long-press Vault trigger and Search button
│   │   │   ├── Button.tsx                    # Standardized button primitive (primary, secondary, ghost, danger)
│   │   │   ├── CommandPalette.tsx            # Hybrid Ctrl+K / mobile search palette and "vault" keyword handler
│   │   │   └── VaultModal.tsx                # Password authentication dialog for /api/vault
│   │   └── utils/
│   │       ├── clipboard.ts                  # Clipboard write utility with execCommand fallback
│   │       ├── recentTools.ts                # Tracks up to 3 recently visited internal tools in localStorage
│   │       └── storage.ts                    # Safe localStorage wrapper (getItemAsync, setItemAsync, deleteItemAsync)
│   ├── styles/
│   │   └── global.css                        # CSS variables, typography tokens, and Bento grid layout rules
│   ├── App.tsx                               # Top-level router, global Ctrl+K listener, and context providers
│   └── main.tsx                              # React DOM entry point
├── index.html                                # HTML shell loading Inter and JetBrains Mono fonts
├── package.json                              # Dependencies and build scripts
├── tsconfig.json                             # Strict TypeScript compiler configuration
├── vercel.json                               # Vercel SPA rewrite rules (/api/* exclusion + /index.html fallback)
└── vite.config.ts                            # Vite bundler config, local dev API middleware, and proxy rules
```

---

## Application Routes & Pages

| Route | Component File | Responsibility |
| :--- | :--- | :--- |
| `/` | `src/pages/HubHome.tsx` | Renders the main workspace hub, Recent Bar (up to 3 recent tools), category filter tabs (`All`, `Tools`, `Games`, `Projects`, `Private`), and Bento grid cards. |
| `/scratchpad` | `src/projects/scratchpad/ScratchpadPage.tsx` | Persistent text and code editor with live character/word/line/byte metrics, file drag-and-drop import, JSON formatter/validator, and multi-extension `Blob` file downloader. |
| `/temp-mail` | `src/projects/temp-mail/TempMailHubPage.tsx` | Disposable email workspace hub supporting `Mail.TM`, `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc` account creation, domain selection, and active inbox routing. |
| `/temp-mail/inbox` | `src/projects/temp-mail/TempMailInboxPage.tsx` | Message list view for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` with manual refresh, sender avatars, timestamps, and message deletion. |
| `/temp-mail/guerrilla-inbox` | `src/projects/temp-mail/GuerrillaInboxPage.tsx` | Dedicated inbox for `GuerrillaMail` managing `sid_token` lifecycle, session expiration recovery, and cached message merging. |
| `/temp-mail/detail` | `src/projects/temp-mail/EmailDetailPage.tsx` | Full message reader with sandboxed HTML `<iframe>` vs. Plain Text toggle, clipboard copy, deletion, and authenticated `Mail.TM` attachment downloads. |
| `/tic-tac-toe` | `src/projects/tic-tac-toe/TicTacToePage.tsx` | Segmented board game workspace containing both **Classic 3x3** (independent `1 Player` AI and `2 Players` board states) and **3-Marker** (no-draw FIFO 3-marker queue variant). |
| `/tic-tac-toe-3` | `src/App.tsx` (`Navigate`) | Redirects to `/tic-tac-toe?variant=3-marker` to open the 3-Marker variant tab directly. |
| `/guess-game` | `src/projects/guess-game/GuessGamePage.tsx` | Numeric deduction game (`0`–`99`, 10 attempts max) with proximity hints within 10 units, color-coded attempt progress bar, and directional guess history chips. |

---

## Serverless API Endpoints

All serverless handlers reside in `/api` for Vercel deployment and are mirrored in `vite.config.ts` for local development.

| Endpoint | Methods | Upstream Target | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/vault` | `POST`, `OPTIONS` | Environment (`ADMIN_PASSWORD`, `PRIVATE_APPS_JSON`) | Validates the submitted password against `process.env.ADMIN_PASSWORD` and returns the parsed array of private projects from `process.env.PRIVATE_APPS_JSON`. |
| `/api/guerrilla` | `GET`, `POST`, `OPTIONS` | `https://api.guerrillamail.com/ajax.php` | Proxies GuerrillaMail AJAX session and inbox requests (`get_email_address`, `set_email_user`, `set_domain`, `check_email`, `fetch_email`, `forget_me`) with CORS headers. |
| `/api/maildrop` | `POST`, `OPTIONS` | `https://api.maildrop.cc/graphql` | Proxies GraphQL queries and mutations (`GetInbox`, `GetMessage`, `DeleteMessage`) to Maildrop.cc. |
| `/api/tempmail-lol` | `GET`, `POST`, `OPTIONS` | `https://api.tempmail.lol` | Proxies inbox creation (`/v2/inbox/create`) and token-authenticated message polling (`/v2/inbox?token=...`) to TempMail.lol. |

---

## Tech Stack & Design System

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 6
- **Routing**: React Router v6 (`react-router-dom`)
- **HTTP Client**: Axios + native Fetch API
- **Icons**: `react-icons/fi` (Feather Icons)
- **Design Tokens (`src/styles/global.css`)**:
  - App Background: `#0E1015`
  - Surface / Card: `#161922` (`1px solid #252A37`, hover `#363D4F`)
  - Typography: `Inter` (UI) and `JetBrains Mono` (code, metrics, addresses, and telemetry)
  - Primary Text: `#F3F4F6`, Secondary Text: `#9CA3AF`, Muted Text: `#6B7280`
  - Accent: `#3B82F6` (Royal Blue)

---

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm

### Installation & Dev Server

```bash
# Install dependencies
npm install

# Start Vite development server (includes local /api/* middleware and proxies)
npm run dev
```

During local development, `vite.config.ts` provides a built-in `/api/vault` middleware that defaults to `ADMIN_PASSWORD=admin` if no environment variable is set.

### Production Build Check

```bash
# Run TypeScript typechecking and Vite production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Vercel Deployment & Environment Variables

1. Import the `ANAS-2004-Cu/ANOUS-SPACE` repository into Vercel.
2. Framework Preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
3. Configure the following Environment Variables in your Vercel Project Settings:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Secret password required by `POST /api/vault` to unlock the Private Vault. | `your-strong-vault-password` |
| `PRIVATE_APPS_JSON` | JSON array defining private tools or external links returned only after successful Vault authentication. | `[{"id":"internal-admin","title":"Admin Console","description":"Internal deployment dashboard","url":"https://admin.example.com","badge":"Private"}]` |

4. Deploy. `vercel.json` automatically routes `/api/*` requests to the serverless functions in `api/` and rewrites all client routes to `/index.html`.
