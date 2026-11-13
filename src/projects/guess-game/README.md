# Number Guess (`src/projects/guess-game`)

Range-finding numeric deduction game (`0`–`99`) mounted at `/guess-game`.

---

## Files

| File | Description |
| :--- | :--- |
| `GuessGamePage.tsx` | Main game component managing target generation, input sanitization, proximity evaluation, attempt progress bar, and guess history chips. |
| `README.md` | Module documentation. |

---

## Rules & State Flow

1. **Target Initialization**: On mount and on `RESET`, a random integer in the inclusive range `0` to `99` is generated via `Math.floor(Math.random() * 100)`.
2. **Attempt Budget**: The player has `MAX_TRIES = 10` attempts to identify the target integer.
3. **Input Validation**:
   - Non-numeric characters are stripped on input; up to 2 digits are accepted.
   - Submitting an empty input or a number outside `0`–`99` displays a validation diagnostic without consuming an attempt.
4. **Proximity Telemetry**:
   - **Exact Match (`value === randomNumber`)**: Marks the round as won (`hit = false`), locks further guesses until reset, and highlights the status panel in green (`#10B981`).
   - **Close Range (`Math.abs(randomNumber - value) <= 10`)**: Signals that the guess is within 10 units of the target (`Close — Too High (Within 10)` or `Close — Too Low (Within 10)`).
   - **Standard Range (`> 10` units away)**: Signals `Too High` or `Too Low`.
   - **Limit Reached (`tries >= 10`)**: Reveals the target number and disables further input until `RESET`.
5. **Visual Telemetry**:
   - **Remaining Attempts Progress Bar**: Dynamically transitions from green (`> 50%` remaining) to amber (`25%–50%`) to red (`<= 25%`).
   - **Previous Guesses Strip**: Renders each submitted guess in order with a directional indicator (`Up` arrow if the guess was too low, `Down` arrow if too high, or a `Check` icon on an exact match).
