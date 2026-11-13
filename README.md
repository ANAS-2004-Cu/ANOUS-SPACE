<div align="center">

# ANOUS-SPACE

**A modular, keyboard-first personal engineering workspace hosting self-contained web utilities, tactical game prototypes, external project showcases, and a session-scoped Private Vault.**

[![React](https://img.shields.io/badge/React-18.3-131929?style=flat-square&logo=react&logoColor=3B82F6)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-131929?style=flat-square&logo=typescript&logoColor=3B82F6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-131929?style=flat-square&logo=vite&logoColor=3B82F6)](https://vite.dev/)
[![Vercel Edge](https://img.shields.io/badge/Runtime-Vercel_Edge-131929?style=flat-square&logo=vercel&logoColor=F3F4F6)](https://vercel.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-anous--space.vercel.app-3B82F6?style=flat-square)](https://github.com/ANAS-2004-Cu/ANOUS-SPACE)

</div>

---

## Overview

Developers routinely scatter small utility scripts, disposable inbox clients, game prototypes, and portfolio links across dozens of bookmarks and separate repositories. **ANOUS-SPACE** consolidates them under a single, fast, keyboard-driven host shell.

The root shell (`src/App.tsx` and `src/pages/HubHome.tsx`) handles routing, global search, theme switching, and session security, while every internal micro-application lives inside an isolated feature directory (`src/projects/<module>/`) with its own tailored visual atmosphere and documentation.

---

## Hub Shell Capabilities

- **Category-Coded Bento Grid & `1`–`9` Direct Launch**: Organizes workspace cards into color-coded domains—`Tools` (`#3B82F6` Electric Blue), `Games` (`#10B981` Emerald), and 2-column `Projects` showcases (`#8B5CF6` Violet)—with custom geometric SVG watermarks. Pressing number keys `1`–`9` on the Hub Home (when no input or modal is active) launches the corresponding visible card immediately.
- **Recent Tools Bar**: Tracks the last 3 opened public internal workspaces in `localStorage` (`anous_recent_tools`) and surfaces them as quick-launch chips above the category filter bar.
- **Hybrid Command Palette (`Ctrl+K` & Touch Search)**: Global modal launcher (`src/shared/ui/CommandPalette.tsx`) accessible from any route via `Ctrl+K` (`Cmd+K` on macOS) or the header `Search` button, indexing titles, descriptions, categories, badges, and search keywords.
- **Adaptive Dark & Crisp Light Themes**: Instant theme switcher in `AppHeader` (`localStorage['anous_theme']`) toggling between the midnight-navy dark shell (`#0B0F19`) and warm daylight paper (`#F4F6FA`), while allowing each internal module to project its own custom route canvas.
- **Session-Backed Private Vault**: Authenticates against `POST /api/vault` (`src/shared/context/VaultContext.tsx`) and stores unlocked session state in `window.sessionStorage['anous_vault_session']`. While unlocked, a Rose-accented `Private` tab (`#F43F5E`) and header lock control appear, and guarded internal routes become accessible until the tab is closed or locked.

> [!TIP]
> **Unlocking the Private Vault**: On desktop, press `Ctrl+K`, type `vault`, and hit `Enter` to open the Vault authentication prompt. On mobile or touch devices, press and hold **ANAS GAMAL** in the top-left header for **2 seconds** (`2000ms`) to trigger the same modal.

---

## High-Level Directory Tree

```text
ANOUS-SPACE/
├── api/                          # Serverless API endpoints (Vault auth & upstream CORS proxies)
├── docs/                         # System architecture & developer extension guides
├── public/                       # Static brand assets
└── src/
    ├── data/                     # Public Bento Grid & Command Palette registry (projects.ts)
    ├── pages/                    # Host shell dashboard view (HubHome.tsx)
    ├── projects/                 # Self-contained, isolated micro-application modules
    │   ├── guess-game/           # Number Guess (0–99) — Dynamic Temperature Radar
    │   ├── scratchpad/           # Quick Scratchpad & File Maker — Code Studio IDE
    │   ├── temp-mail/            # Multi-Provider Temp-Mail Suite — Modern Inbox Client
    │   └── tic-tac-toe/          # Tic-Tac-Toe Arena — Classic 3x3 & 3-Marker Queue
    ├── shared/                   # Cross-workspace UI primitives, contexts, and utilities
    │   ├── context/              # ThemeContext, AlertContext, and VaultContext
    │   ├── ui/                   # AppHeader, Button, AlertModal, CommandPalette, VaultModal
    │   └── utils/                # storage, clipboard, and recentTools helpers
    └── styles/                   # Global CSS custom properties, layouts, and keyframe animations
```

---

## Public Modules Index

Each internal module is self-contained and documented inside its own directory:

| Module | Base Route | Category | Route Atmosphere | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Quick Scratchpad & File Maker** | `/scratchpad` | `Tools` | Code Studio IDE (`#0D1117` Obsidian) | [./src/projects/scratchpad/README.md](./src/projects/scratchpad/README.md) |
| **Temp-Mail Client** | `/temp-mail` | `Tools` | Modern Inbox Client (`#0F1322` Indigo Slate) | [./src/projects/temp-mail/README.md](./src/projects/temp-mail/README.md) |
| **Tic-Tac-Toe (Classic & 3-Marker)** | `/tic-tac-toe` | `Games` | Tactile Tabletop Arena (`#13141B` Charcoal) | [./src/projects/tic-tac-toe/README.md](./src/projects/tic-tac-toe/README.md) |
| **Number Guess (0–99)** | `/guess-game` | `Games` | Dynamic Temperature Radar (`#0C1624` → `#241313`) | [./src/projects/guess-game/README.md](./src/projects/guess-game/README.md) |

---

## Architecture & Developer Guides

- [**System Architecture (`./docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md) — Mermaid system topology, Module Isolation Rule, shared contexts/utilities, `<VaultGuard>` route protection, and theme token specifications.
- [**Developer Playbook (`./docs/EXTENDING.md`)**](./docs/EXTENDING.md) — Exact `ProjectItem` TypeScript schema and step-by-step guides for adding external showcases or mounting isolated internal modules.
