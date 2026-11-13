# ANOUS-SPACE

[![React](https://img.shields.io/badge/React-18.3-131929?style=flat-square&logo=react&logoColor=3B82F6)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-131929?style=flat-square&logo=typescript&logoColor=3B82F6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-131929?style=flat-square&logo=vite&logoColor=3B82F6)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/Runtime-Vercel_Serverless-131929?style=flat-square&logo=vercel&logoColor=F3F4F6)](https://vercel.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-anous--space.vercel.app-3B82F6?style=flat-square)](https://github.com/ANAS-2004-Cu/ANOUS-SPACE)

Every developer ends up scattering small utility scripts, disposable test tools, game prototypes, and portfolio links across dozens of bookmarks and separate repositories. **ANOUS-SPACE** brings them together under one fast, keyboard-first command deck.

Rather than forcing every tool into a rigid single-template look, the Hub Home acts as an energetic midnight-navy launcher where each mounted micro-app steps into its own bespoke visual atmosphere—from a GitHub-dark code studio for the Scratchpad to a dynamic temperature-shifting radar for Number Guess—while sharing a unified navigation bar, Command Palette, and Dark/Light theme engine.

---

## Hub Platform Features

- **Keyboard-First Navigation (`Ctrl+K` & `1`–`9` Shortcuts)**: Open the global Command Palette from any screen with `Ctrl+K` (`Cmd+K`), or press `1`–`9` directly on the Hub Home to jump straight into any visible tool or showcase.
- **Category-Coded Bento Grid**: Organizes entries into `Tools` (Electric Blue `#3B82F6`), `Games` (Emerald `#10B981`), `Projects` (Violet `#8B5CF6` 2-column showcases), and `Vault` (Rose `#F43F5E`), complete with custom SVG line-art watermarks and tactile hover elevation.
- **Distinct Per-Module Atmospheres**: Each internal workspace owns its own full-viewport background palette and layout personality while keeping `AppHeader` consistent across every route.
- **Recent Tools Bar**: Automatically remembers the last 3 internal workspaces you opened (`localStorage`) so your most-used utilities stay one click away at the top of the dashboard.
- **Adaptive Dark & Crisp Light Themes**: Switch instantaneously between rich dark atmospheres and high-contrast daylight surfaces, persisted in browser storage.
- **Session-Scoped Private Vault**: Keeps personal staging links and restricted internal tools completely out of the client bundle until unlocked via `/api/vault`. Once authenticated, private cards appear under a dedicated Rose-accented `Private` tab and lock automatically as soon as the browser tab closes (`sessionStorage`).

> [!TIP]
> **Unlocking the Private Vault**: On desktop, press `Ctrl+K`, type `vault`, and hit `Enter`. On mobile or touch devices, press and hold **ANAS GAMAL** in the top-left header for **2 seconds** to open the Vault password prompt.

---

## High-Level Directory Tree

```text
ANOUS-SPACE/
├── api/                          # Serverless API endpoints (Vault auth & module proxies)
├── docs/                         # Hub architecture and module extension guides
├── public/                       # Static assets
└── src/
    ├── data/                     # Central project and module registry (projects.ts)
    ├── pages/                    # Hub shell home view (HubHome.tsx)
    ├── projects/                 # Isolated, self-contained internal modules
    │   ├── guess-game/           # Number Guess (Dynamic Temperature Radar)
    │   ├── scratchpad/           # Quick Scratchpad & File Maker (Code Studio IDE)
    │   ├── temp-mail/            # Multi-Provider Temp-Mail (Modern Inbox Client)
    │   └── tic-tac-toe/          # Tic-Tac-Toe Arena (Classic & 3-Marker Queue)
    ├── shared/                   # Shared UI primitives, contexts, and browser utilities
    │   ├── context/              # ThemeContext, AlertContext, and VaultContext
    │   ├── ui/                   # AppHeader, Button, AlertModal, CommandPalette, VaultModal
    │   └── utils/                # storage, clipboard, and recentTools helpers
    └── styles/                   # Global dark/light theme tokens & animations (global.css)
```

---

## Modules Index

Each internal micro-app is self-contained and documented inside its own directory:

| Module | Base Route | Category | Atmosphere & Identity | Module Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Quick Scratchpad & File Maker** | `/scratchpad` | `Tools` | Code Studio / IDE (`#0D1117` Obsidian) | [./src/projects/scratchpad/README.md](./src/projects/scratchpad/README.md) |
| **Temp-Mail Client** | `/temp-mail` | `Tools` | Modern Inbox Client (`#0F1322` Indigo Slate) | [./src/projects/temp-mail/README.md](./src/projects/temp-mail/README.md) |
| **Tic-Tac-Toe (Classic & 3-Marker)** | `/tic-tac-toe` | `Games` | Tactile Board Arena (`#13141B` Charcoal Tabletop) | [./src/projects/tic-tac-toe/README.md](./src/projects/tic-tac-toe/README.md) |
| **Number Guess (0–99)** | `/guess-game` | `Games` | Dynamic Temperature Radar (Cool Slate to Terracotta) | [./src/projects/guess-game/README.md](./src/projects/guess-game/README.md) |

---

## Architecture Guides

- [./docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Hub shell internals, Mermaid system diagram, shared context/UI layer, and the Module Isolation Rule.
- [./docs/EXTENDING.md](./docs/EXTENDING.md) — `ProjectItem` schema and step-by-step checklists for registering external showcases or mounting new internal modules.
