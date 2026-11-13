<div align="center">

# ANOUS-SPACE

**A modular, keyboard-first personal engineering hub hosting self-contained web utilities, tactical game prototypes, external project showcases, and a session-scoped Private Vault.**

[![React 18](https://img.shields.io/badge/React-18.3-131929?style=flat-square&logo=react&logoColor=3B82F6)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.6-131929?style=flat-square&logo=typescript&logoColor=3B82F6)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-131929?style=flat-square&logo=vite&logoColor=3B82F6)](https://vite.dev/)
[![Vercel Edge](https://img.shields.io/badge/Runtime-Vercel_Edge-131929?style=flat-square&logo=vercel&logoColor=F3F4F6)](https://vercel.com/)
[![Live Workspace](https://img.shields.io/badge/Live_Workspace-anous--space.vercel.app-3B82F6?style=flat-square)](https://github.com/ANAS-2004-Cu/ANOUS-SPACE)

</div>

---

## Overview

Most developers end up scattering disposable test tools, scratchpad scripts, experimental mini-games, and portfolio showcases across dozens of browser bookmarks and standalone repositories. **ANOUS-SPACE** consolidates them into a single, zero-friction command deck.

The root application acts strictly as a lightweight **Host Shell**: it provides global navigation, instant keyboard routing, theme orchestration, and session security, while every internal micro-app lives inside its own isolated directory (`src/projects/<module>/`) with its own tailored visual atmosphere and documentation.

---

## Hub Platform Capabilities

- **Adaptive Category-Coded Bento Grid**: Organizes workspace entries into color-coded domains—`Tools` (Electric Blue `#3B82F6`), `Games` (Emerald `#10B981`), and 2-column `Projects` showcases (Violet `#8B5CF6`)—complete with custom geometric SVG watermarks, keyboard shortcut badges (`1`–`9`), and a persistent **Recent Tools** bar.
- **Hybrid `Ctrl+K` & Mobile Command Palette**: Launch any public tool, filter by keyword, or trigger administrative actions from anywhere in the workspace using `Ctrl+K` (`Cmd+K` on macOS) or the persistent header `Search` trigger on touch devices.
- **Dual Dark & Crisp Light Themes**: Toggle instantaneously between a deep midnight-navy dark palette (`#0B0F19`) and a warm daylight paper palette (`#F4F6FA`), while allowing each mounted micro-app to render its own specialized surface atmosphere.
- **Session-Backed Private Vault**: Protects restricted internal tools and private deployments behind server-side authentication (`POST /api/vault`). Unlocked modules and links appear dynamically under a Rose-accented `Private` category (`#F43F5E`) and automatically purge when the browser tab closes (`sessionStorage`).

> [!TIP]
> **Unlocking the Private Vault**: On desktop, press `Ctrl+K`, type `vault`, and press `Enter`. On mobile or touch screens, press and hold **ANAS GAMAL** in the top-left header for **2 seconds** (`2000ms`) to open the Vault authentication modal.

---

## High-Level Architecture Tree

```text
ANOUS-SPACE/
├── api/                          # Serverless API endpoints (Vault auth & upstream CORS proxies)
├── docs/                         # System architecture & module extension playbooks
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

Every internal micro-app is self-contained and documented inside its own module directory:

| Module | Route | Category | Visual Atmosphere | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Quick Scratchpad & File Maker** | `/scratchpad` | `Tools` | Code Studio IDE (`#0D1117` Obsidian) | [Module README](./src/projects/scratchpad/README.md) |
| **Temp-Mail Client** | `/temp-mail` | `Tools` | Modern Inbox Client (`#0F1322` Indigo Slate) | [Module README](./src/projects/temp-mail/README.md) |
| **Tic-Tac-Toe (Classic & 3-Marker)** | `/tic-tac-toe` | `Games` | Tactile Tabletop Arena (`#13141B` Charcoal) | [Module README](./src/projects/tic-tac-toe/README.md) |
| **Number Guess (0–99)** | `/guess-game` | `Games` | Dynamic Temperature Radar (`#0C1624` → `#241313`) | [Module README](./src/projects/guess-game/README.md) |

---

## Platform Documentation

| Guide | Scope |
| :--- | :--- |
| [**System Architecture (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md) | Mermaid system topology, Module Isolation Rule, shared contexts, Vault route guards, and theme token specifications. |
| [**Developer Playbook (`docs/EXTENDING.md`)**](./docs/EXTENDING.md) | `ProjectItem` TypeScript schema and step-by-step checklists for registering external showcases or mounting new internal modules. |
