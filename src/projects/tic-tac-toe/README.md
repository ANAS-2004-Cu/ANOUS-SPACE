# Tic-Tac-Toe (Classic & 3-Marker)

## Overview

Standard Tic-Tac-Toe almost always grinds to a stalemate once both players know the opening traps. Set inside a warm charcoal-slate Tabletop Arena (`#13141B`) with recessed game cells and bold Sky-Blue `X` (`#38BDF8`) vs. Coral-Orange `O` (`#FB923C`) markers, this workspace pairs **Classic 3x3** with a fast-paced **3-Marker Queue** variant—where each player can hold at most three markers on the board and placing a fourth evicts their oldest piece, making draws impossible.

## Files

- `TicTacToePage.tsx`: Implements the raised tabletop arena (`#1C1F2B`), segmented variant switcher (`Classic 3x3` | `3-Marker Queue`), independent `1 Player` and `2 Players` board snapshots for Classic mode, the FIFO 3-marker eviction queue with dashed `FADING` warning cues on the oldest marker, pop-in marker scale animations, emerald winning-line highlights, and AI move heuristics.
- `README.md`: Module documentation for the Tic-Tac-Toe workspace.

## Routes & Endpoints

- `/tic-tac-toe`: Primary client route rendering `TicTacToePage` (supports optional `?variant=3-marker` query parameter).
- `/tic-tac-toe-3`: Client redirect route forwarding directly to `/tic-tac-toe?variant=3-marker`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'tic-tac-toe'` via `recordRecentProject('tic-tac-toe')` when the workspace opens (board state is kept in React component memory).
