# Tic-Tac-Toe (Classic & 3-Marker)

## Overview

Tic-Tac-Toe is a dual-variant board game workspace featuring both Classic 3x3 and a no-draw Three-Marker FIFO queue variant inside a segmented tab view. Both variants support single-player heuristic AI opponents and two-player local pass-and-play modes.

## Files

- `TicTacToePage.tsx`: Implements the segmented variant switcher (`Classic 3x3` | `3-Marker`), independent `1 Player` and `2 Players` board snapshots for Classic mode, the 3-marker FIFO eviction queue (`xPositions` / `oPositions`), and AI move heuristics.
- `README.md`: Module documentation for the Tic-Tac-Toe workspace.

## Routes & Endpoints

- `/tic-tac-toe`: Primary client route rendering `TicTacToePage` (supports optional `?variant=3-marker` query parameter).
- `/tic-tac-toe-3`: Client redirect route forwarding to `/tic-tac-toe?variant=3-marker`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'tic-tac-toe'` via `recordRecentProject('tic-tac-toe')` when the module mounts (all board state is held in React component memory).
