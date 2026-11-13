# Tic-Tac-Toe Arena (Classic & 3-Marker Queue)

[![Category](https://img.shields.io/badge/Category-Games-10B981?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Ftic--tac--toe-1C1F2B?style=flat-square)](#routes--endpoints)
[![Variants](https://img.shields.io/badge/Variants-Classic_3x3_%7C_3--Marker_FIFO-38BDF8?style=flat-square)](#overview)

## Overview

Standard Tic-Tac-Toe almost always ends in a predictable draw once both players know the opening traps. Set inside a warm charcoal-slate **Tactile Board Game Arena** (`#13141B` in Dark Mode / `#F4F4F7` in Light Mode) with a raised tabletop (`#1C1F2B`), recessed cells, and bold Sky-Blue `X` (`#38BDF8`) vs. Warm Coral-Orange `O` (`#FB923C`) markers, this workspace combines two distinct rule sets in one arena:

1. **Classic 3x3 Tabletop**: Supports both `1 Player` (vs. tactical AI) and `2 Players` pass-and-play while preserving independent board snapshots when switching between modes.
2. **3-Marker Queue Variant**: Enforces a strict FIFO queue of at most **3 active markers per player**—turning every 4th move into a simultaneous placement and eviction that makes draws impossible.

> [!TIP]
> **FIFO 3-Marker Eviction Mechanic**: In `3-Marker Queue` mode, each player's coordinates are tracked in a 3-slot queue (`xPositions` and `oPositions`). As soon as a player holds 3 markers on the board, their oldest marker is highlighted with a dashed border and a `FADING` badge—warning both players that placing a 4th marker will immediately evict that oldest piece from the grid.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `TicTacToePage.tsx` | Implements the raised tabletop arena, segmented variant switcher (`Classic 3x3` \| `3-Marker Queue`), independent `1 Player` / `2 Players` state snapshots, FIFO 3-marker eviction queue with `FADING` visual cues, pop-in marker animations, emerald (`#10B981`) winning-line highlights, and AI move heuristics. |
| `README.md` | Module documentation for the Tic-Tac-Toe Arena workspace. |

---

## Routes & Endpoints

| Route | Component / Behavior | Responsibility |
| :--- | :--- | :--- |
| `/tic-tac-toe` | `TicTacToePage` | Primary arena route supporting both `Classic 3x3` (default) and `?variant=3-marker` query deep-linking. |
| `/tic-tac-toe-3` | `<Navigate>` Redirect | Convenience alias redirecting directly to `/tic-tac-toe?variant=3-marker`. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_recent_tools` | `localStorage` | Records `'tic-tac-toe'` via `recordRecentProject('tic-tac-toe')` when the arena opens (active board matrices are held in React state). |
