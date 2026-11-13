# Tic-Tac-Toe (Classic & 3-Marker)

## Overview

Standard Tic-Tac-Toe often ends in a predictable draw once both players know the basics. This workspace pairs the **Classic 3x3** game with a tactical **3-Marker FIFO variant**—where each player can hold at most three markers on the grid and placing a fourth evicts their oldest marker, eliminating draws entirely.

## Files

- `TicTacToePage.tsx`: Implements the segmented variant switcher (`Classic 3x3` | `3-Marker`), independent `1 Player` and `2 Players` board snapshots for Classic mode, the FIFO 3-marker eviction queue (`xPositions` / `oPositions`), and AI move heuristics.
- `README.md`: Module documentation for the Tic-Tac-Toe workspace.

## Routes & Endpoints

- `/tic-tac-toe`: Primary client route rendering `TicTacToePage` (supports optional `?variant=3-marker` query parameter).
- `/tic-tac-toe-3`: Client redirect route forwarding directly to `/tic-tac-toe?variant=3-marker`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'tic-tac-toe'` via `recordRecentProject('tic-tac-toe')` when the workspace opens (board state is kept in React component memory).
