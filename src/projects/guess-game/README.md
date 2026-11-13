# Number Guess (0–99)

## Overview

Number Guess is a quick range-finding deduction game built around binary-search intuition: you have 10 attempts to lock onto a hidden integer between `0` and `99`. Each guess returns directional feedback, triggers a close-range proximity alert when you land within 10 units of the target, and logs a directional chip in your attempt history.

## Files

- `GuessGamePage.tsx`: Implements target generation, 2-digit numeric input sanitization, proximity evaluation (`<= 10`), color-coded remaining attempts progress bar, and chronological guess history chips.
- `README.md`: Module documentation for the Number Guess workspace.

## Routes & Endpoints

- `/guess-game`: Client route rendering `GuessGamePage`.

## Storage Keys

- `anous_recent_tools` (`localStorage`): Records `'guess-game'` via `recordRecentProject('guess-game')` when the workspace opens (round state is kept in React component memory).
