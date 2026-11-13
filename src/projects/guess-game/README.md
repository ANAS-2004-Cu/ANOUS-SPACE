# Number Guess (0–99)

## Overview

**Number Guess** turns binary-search deduction into an interactive **Dynamic Temperature Radar**: you have 10 sweeps to lock onto a hidden integer between `0` and `99`. Every coordinate you enter physically shifts the full-page atmosphere—from deep ocean slate (`#0C1624`) when your signal is cold (`> 25`), to warm amber (`#1F1712`) within 25 units, to fiery terracotta (`#241313`) when you close within 10 units, and rich emerald (`#0D211A`) on target lock.

## Files

- `GuessGamePage.tsx`: Implements the proximity-reactive full-viewport background radar, large target readout display, 2-digit coordinate input sanitization, remaining sweeps progress bar, and color-coded directional telemetry pills.
- `README.md`: Module documentation for the Number Guess workspace.

## Routes & Endpoints

- `/guess-game`: Client route rendering `GuessGamePage`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'guess-game'` via `recordRecentProject('guess-game')` when the workspace opens (round state is kept in React component memory).
