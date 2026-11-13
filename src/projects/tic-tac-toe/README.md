# Tic-Tac-Toe Arena (Classic & 3-Marker Queue)

[![Category](https://img.shields.io/badge/Category-Games-10B981?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Ftic--tac--toe-1C1F2B?style=flat-square)](#routes--endpoints)
[![Variants](https://img.shields.io/badge/Variants-Classic_3x3_%7C_3--Marker_Queue-38BDF8?style=flat-square)](#overview)

## Overview

**Tic-Tac-Toe Arena** pairs the traditional **Classic 3x3** game with a draw-proof **3-Marker Queue** variant inside a warm charcoal-slate **Tactile Board Game Arena** (`#13141B` canvas and `#1C1F2B` raised tabletop in Dark Mode; `#F4F4F7` canvas and `#FFFFFF` tabletop in Light Mode).

Game cells sit inside a recessed well (`#0E1017` dark / `#E6E9F2` light) and render bold Sky-Blue `X` (`#38BDF8`) vs. Warm Coral-Orange `O` (`#FB923C`) markers with a `.marker-pop` keyframe scale animation (`@keyframes markerPop`) and Emerald (`#10B981`) winning-line highlights across the 8 standard `WINNING_LINES`.

> [!TIP]
> **Snapshot Isolation, FIFO 3-Marker Eviction & AI Heuristics**:
> - **Classic 3x3 Dual-Snapshot Preservation (`switchClassicMode`)**: Toggling between `1 Player` (`typeBoard === 1`) and `2 Players` (`typeBoard === 2`) saves and restores separate board snapshots (`board1`/`winner1`/`count1` vs. `board2`/`winner2`/`count2`/`isXNext1`) so an in-progress match is never lost when switching modes.
> - **FIFO 3-Marker Queue (`executeTmMove`)**: In `3-Marker Queue` mode, each player's active board indices are stored in a 3-element queue (`xPositions` and `oPositions`). When a player already has 3 markers on the board (`updatedPositions.length === 3`), their oldest marker (`xPositions[0]` or `oPositions[0]`) is styled at `0.55` opacity with a `1.5px dashed` border and a `FADING` badge—and is evicted via `updatedPositions.shift()` as soon as their 4th marker is placed.
> - **Tactical AI Move Priority (`findBestTmMove`)**: In `vs-computer` mode (triggered after a `700ms` thinking delay), the AI evaluates moves in strict priority order: (1) immediate winning move for `O`, (2) immediate blocking move against `X`, (3) center square (`index 4`), (4) random available corner (`[0, 2, 6, 8]`), and (5) random remaining square.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `TicTacToePage.tsx` | Implements the segmented variant switcher (`Classic 3x3` \| `3-Marker Queue` synced with `?variant=3-marker`), dual-mode Classic snapshot state, FIFO 3-marker eviction queue, `FADING` marker indicators, `findBestClassicMove` and `findBestTmMove` AI engines, and winning-line evaluation (`calculateWinner`). |
| `README.md` | Module documentation for the Tic-Tac-Toe Arena workspace. |

---

## Routes & Endpoints

| Route | Component / Element | Responsibility |
| :--- | :--- | :--- |
| `/tic-tac-toe` | `TicTacToePage` | Main arena route; activates `3-Marker Queue` when `?variant=3-marker` is present, or `Classic 3x3` by default. |
| `/tic-tac-toe-3` | `<Navigate to="/tic-tac-toe?variant=3-marker" replace />` | Direct redirect alias defined in `src/App.tsx` for launching the `3-Marker Queue` variant. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_recent_tools` | `localStorage` | Records `'tic-tac-toe'` on mount via `recordRecentProject('tic-tac-toe')` (board states are maintained in React memory). |
