# Tic-Tac-Toe (`src/projects/tic-tac-toe`)

Self-contained board game workspace mounted at `/tic-tac-toe` (with `/tic-tac-toe-3` redirecting to `/tic-tac-toe?variant=3-marker`). Combines **Classic 3x3** and the **Three-Marker FIFO Variant** inside a segmented tab interface.

---

## Files

| File | Description |
| :--- | :--- |
| `TicTacToePage.tsx` | Main component implementing both game variants, AI move selection, independent mode snapshots, and FIFO marker queue tracking. |
| `README.md` | Module documentation. |

---

## Variants & Game Mechanics

### 1. Classic 3x3 (`activeVariant === 'classic'`)
- **Modes**:
  - `1 Player`: Player `X` vs. heuristic AI (`O`).
  - `2 Players`: Local pass-and-play alternating between `X` and `O`.
- **Independent State Snapshots**: Switching between `1 Player` and `2 Players` preserves the active board, move counter, turn state, and winner of each mode (`board1`/`winner1`/`count1` vs. `board2`/`winner2`/`count2`), allowing players to toggle between modes without losing an in-progress game.
- **Immutable State & Win Guard**: Board updates clone the state array immutably (`board.slice()`). When Player `X` completes a winning line in `1 Player` mode, `immediateWinner` is evaluated before invoking `runClassicComputerMove`, preventing the AI from placing a post-win marker.
- **AI Heuristic (`findBestClassicMove`)**:
  1. Checks all 8 winning lines for an immediate winning move for `O`.
  2. Checks all 8 winning lines to block an immediate 2-in-a-row threat by `X`.
  3. Falls back to a random available square.

### 2. Three-Marker Variant (`activeVariant === '3-marker'`)
- **FIFO Queue Rule**: Each player can hold at most **3 markers** on the board simultaneously (`xPositions` and `oPositions` arrays).
- **4th Move Eviction**: When a player with 3 active markers places a new marker, their oldest marker (`positions.shift()`) is automatically removed from the board before the new marker is recorded. The oldest marker about to be evicted is visually indicated with a dashed border and reduced opacity.
- **Modes**:
  - `vs Computer`: Player `X` vs. AI `O` (executed after a 700ms `setTimeout` delay for natural turn pacing).
  - `2 Players`: Local pass-and-play.
- **AI Priority (`findBestTmMove`)**:
  1. Immediate winning move for `O`.
  2. Immediate blocking move against `X`.
  3. Center square (`index 4`) if unoccupied.
  4. Random available corner (`0, 2, 6, 8`).
  5. Random remaining available square.
