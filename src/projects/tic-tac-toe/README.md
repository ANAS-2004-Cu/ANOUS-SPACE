# Tic-Tac-Toe · لعبة إكس-أو التكتيكية

**Route / المسار:** `/tic-tac-toe`  
**Accent / الهوية اللونية:** `ochre`

---

## English Documentation

### 1. Overview
**Tic-Tac-Toe** is a dual-mode tactical grid game built on a pure, deterministic state engine (`gameEngine.ts`) with two distinct rule sets:
1. **Classic Mode (`classic`):** Traditional $3 \times 3$ grid playable in **2-Player Pass & Play (`pvp`)** or against an **Unbeatable Minimax AI (`ai`)**.
2. **3-Marker Mode (`three-marker`):** Draw-free FIFO tactical variant where each player can have at most **3 markers** on the board simultaneously. When a player has 3 markers placed, their oldest marker is highlighted as armed for removal and vanishes as soon as they place their 4th marker.

### 2. File Structure
- `TicTacToePage.tsx`: Main page switching between Classic Mode and 3-Marker Mode via `SegmentedControl`.
- `gameEngine.ts`: Pure game logic (`WINNING_LINES`, `calculateWinner`, `findBestMove` Minimax algorithm, and `applyThreeMarkerMove` FIFO transition).
- `useClassicTicTacToe.ts`: Hook managing Classic Mode board state, `pvp` vs `ai` sub-mode, scoreboards, and delayed AI turn execution (`350ms`).
- `useThreeMarkerTicTacToe.ts`: Hook managing 3-Marker queues (`xQueue`, `oQueue`), board state, and oldest-marker expiry detection.
- `components/`:
  - `ClassicBoard.tsx`: $3 \times 3$ grid highlighting winning line cells.
  - `ThreeMarkerBoard.tsx`: $3 \times 3$ grid with move-order badges (`1`, `2`, `3`) and pulsing expiry indicator on the oldest piece.
  - `ScoreStrip.tsx`: Live scoreboard (`X`, `Draws`/`Rule`, `O`) and reset controls.

### 3. Core Logic & Rules (`gameEngine.ts`)
- **Winning Lines:** Evaluates all 8 standard orthogonal and diagonal triplets (`WINNING_LINES`).
- **Unbeatable AI (`findBestMove`):**
  - Uses recursive **Minimax** where AI (`O`) maximizes score (`10 - depth`) and Human (`X`) minimizes score (`depth - 10`), guaranteeing optimal play.
- **3-Marker FIFO Queue (`applyThreeMarkerMove`):**
  - Maintains ordered queues `xQueue: number[]` and `oQueue: number[]`.
  - Before a player with 3 active markers places a new marker at `index`, `activeQueue[0]` is shifted off the queue and cleared from the board (`nextBoard[removed] = null`), then `index` is appended and `calculateWinner(nextBoard)` is evaluated.

### 4. State & Storage Persistence
- Game boards and session scoreboards are held in React state (`useClassicTicTacToe` and `useThreeMarkerTicTacToe`) and reset cleanly via **New Round** or **Reset Scores**.
- Visiting `/tic-tac-toe` records `'tic-tac-toe'` in `anous_recent_tools`.

### 5. Customization Guide
- **Adjust AI Thinking Delay:** Edit the `350` ms timeout in `src/projects/tic-tac-toe/useClassicTicTacToe.ts`.
- **Modify Board Sizing & Cell Animations:** Edit `.ttt-board` and `.ttt-cell` in `src/styles/games.css`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
لعبة **إكس-أو (Tic-Tac-Toe)** هي لعبة شبكة تكتيكية ثنائية الطور تتضمن:
1. **الطور الكلاسيكي (Classic Mode):** اللعب التقليدي على شبكة $3 \times 3$ إما ضد لاعب آخر محلياً (`2P Local`) أو ضد ذكاء اصطناعي لا يُهزم (`Unbeatable AI`) يعتمد على خوارزمية Minimax.
2. **طور الثلاث قطع (3-Marker FIFO Mode):** طور تكتيكي يمنع التعادل؛ حيث يمتلك كل لاعب **3 قطع كحد أقصى** على اللوحة. عند وضع القطعة الرابعة، تختفي القطعة الأقدم للاعب تلقائياً بنظام الطابور (`FIFO`).

### 2. هيكل الملفات
- `TicTacToePage.tsx`: واجهة اللعبة الرئيسية والتبديل بين الأطوار.
- `gameEngine.ts`: المحرك المنطقي النقي (فحص الفوز، خوارزمية Minimax، ومنطق طابور الثلاث قطع).
- `useClassicTicTacToe.ts`: الخطاف البرمجي للطور الكلاسيكي.
- `useThreeMarkerTicTacToe.ts`: الخطاف البرمجي لطور الثلاث قطع.
- `components/`: مكونات اللوحة (`ClassicBoard`, `ThreeMarkerBoard`) وشريط النتائج (`ScoreStrip`).

### 3. القواعد والخوارزميات الأساسية
- **خوارزمية الذكاء الاصطناعي (`findBestMove`):** تستكشف كافة الحالات الممكنة للعبة وتختار الحركة التي تعظم نقاط الذكاء الاصطناعي (`10 - depth`) وتقلل نقاط الخصم (`depth - 10`).
- **قاعدة الاختفاء التلقائي (`applyThreeMarkerMove`):** عندما يصل طول طابور اللاعب إلى 3 خانات، يتم تمييز الخانة الأولى (`queue[0]`) بعلامة تحذيرية، وبمجرد اختيار الخانة الجديدة تُحذف الخانة الأقدم فوراً.

### 4. كيفية التخصيص
- لتغيير سرعة استجابة الذكاء الاصطناعي، عدّل مهلة `setTimeout` (`350` مللي ثانية) في الملف `src/projects/tic-tac-toe/useClassicTicTacToe.ts`.
- لتعديل تصميم الشبكة والألوان، راجع الملف `src/styles/games.css`.

</div>
