# Number Guess (0–99)

## Overview

Number Guess is a numeric deduction game where the player has 10 attempts to identify a randomly generated integer between `0` and `99`. It provides directional hints, close-range proximity alerts when a guess is within 10 units of the target, a color-coded remaining attempts progress bar, and a chronological guess history strip.

## Files

- `GuessGamePage.tsx`: Implements target number generation, numeric input validation, proximity evaluation (`<= 10`), attempt progress visualization, and directional guess history chips.
- `README.md`: Module documentation for the Number Guess workspace.

## Routes & Endpoints

- `/guess-game`: Client route rendering `GuessGamePage`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'guess-game'` via `recordRecentProject('guess-game')` when the module mounts (all game state is held in React component memory).
