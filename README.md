# ANOUS-SPACE

`ANOUS-SPACE` is a modular personal workspace shell that hosts self-contained micro-applications, external project showcases, and a session-backed Private Vault behind a unified interface.

---

## Hub Platform Features

- **Bento Grid & Category Filtering**: Renders internal workspaces and external showcases from a central registry (`src/data/projects.ts`) with category filters (`All`, `Tools`, `Games`, `Projects`, and `Private`).
- **Recent Tools Bar**: Tracks and surfaces the 3 most recently opened internal modules via `localStorage`.
- **Hybrid Command Palette**: Provides real-time search across all registered modules and showcases via `Ctrl+K` (`Cmd+K`) on desktop or the header Search trigger on mobile.
- **Private Vault Lock/Unlock Flow**: Authenticates against `/api/vault` (triggered by typing `vault` in the Command Palette or holding `ANAS GAMAL` in the header for 2 seconds) and persists unlocked private entries in `sessionStorage` for the current tab session.

---

## High-Level Directory Tree

```text
ANOUS-SPACE/
├── api/                          # Serverless API endpoints (Vault authentication & module proxies)
├── docs/                         # Hub architecture and module extension guides
├── public/                       # Static assets
└── src/
    ├── data/                     # Central project and module registry (projects.ts)
    ├── pages/                    # Hub shell home view (HubHome.tsx)
    ├── projects/                 # Isolated, self-contained internal modules
    │   ├── guess-game/           # Number Guess module
    │   ├── scratchpad/           # Quick Scratchpad & File Maker module
    │   ├── temp-mail/            # Multi-Provider Temp-Mail module
    │   └── tic-tac-toe/          # Tic-Tac-Toe (Classic & 3-Marker) module
    ├── shared/                   # Shared UI primitives, contexts, and browser utilities
    │   ├── context/              # AlertContext and VaultContext providers
    │   ├── ui/                   # AppHeader, Button, AlertModal, CommandPalette, VaultModal
    │   └── utils/                # storage, clipboard, and recentTools helpers
    └── styles/                   # Global matte dark design tokens (global.css)
```

---

## Modules Index

| Module | Base Route | Module Documentation |
| :--- | :--- | :--- |
| **Quick Scratchpad & File Maker** | `/scratchpad` | [./src/projects/scratchpad/README.md](./src/projects/scratchpad/README.md) |
| **Temp-Mail Client** | `/temp-mail` | [./src/projects/temp-mail/README.md](./src/projects/temp-mail/README.md) |
| **Tic-Tac-Toe (Classic & 3-Marker)** | `/tic-tac-toe` | [./src/projects/tic-tac-toe/README.md](./src/projects/tic-tac-toe/README.md) |
| **Number Guess (0–99)** | `/guess-game` | [./src/projects/guess-game/README.md](./src/projects/guess-game/README.md) |

---

## Architecture Guides

- [./docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Hub shell internals, shared context/UI layer, design tokens, and the Module Isolation Rule.
- [./docs/EXTENDING.md](./docs/EXTENDING.md) — `ProjectItem` schema and checklist for registering external showcases or mounting new internal modules.
