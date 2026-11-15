# Tic-Tac-Toe · لعبة إكس-أو التكتيكية

**Route / المسار:** `/tic-tac-toe` (supports `?variant=3-marker`)  
**Accent / الهوية اللونية:** `ochre`

---

## English Documentation

### 1. Overview
**Tic-Tac-Toe** is a dual-mode tactical grid game built on a pure state and AI engine (`gameEngine.ts`) with two distinct rule sets, three single-player AI difficulty levels (**Easy**, **Medium**, **Hard**), and an interactive in-app **"How to Play"** rules guide:
1. **Classic 3×3 Mode (`classic`):** Traditional $3 \times 3$ grid playable in **1 Player (vs Computer)** or **2 Players (Pass & Play)**. Switching between 1P and 2P preserves the state of both boards independently.
2. **3-Marker Mode (`3-marker`):** Draw-free FIFO tactical variant where each player can hold at most **3 active markers** on the board simultaneously. When a player has 3 pieces placed, their oldest piece is highlighted with a dashed border and a `NEXT OUT` badge—and vanishes automatically as soon as they place their 4th marker.

### 2. File Structure
- `TicTacToePage.tsx`: Main page view providing variant switching (`Classic 3×3` vs `3-Marker Mode`), player mode buttons (`1 Player` / `vs Computer` vs `2 Players`), the conditional **AI Difficulty** selector (`Easy`, `Medium`, `Hard`), and the collapsible **How to Play** rules card.
- `GameBoard.tsx`: Reusable $3 \times 3$ board component with animated SVG markers (`X` and `O`), hover ghost previews, `NEXT OUT` oldest-piece indicator, and animated winning-line strike overlay.
- `gameEngine.ts`: Pure game logic (`WINNING_LINES`, `calculateWinner`, `getWinningLine`, `getWinningIndices`) and multi-difficulty AI move selection (`findBestClassicMove`, `findBestThreeMarkerMove`).
- `useClassicTicTacToe.ts`: Custom React hook managing Classic 1P/2P boards, difficulty selection (`classicDifficulty`), and turn transitions.
- `useThreeMarkerTicTacToe.ts`: Custom React hook managing 3-Marker FIFO queues (`xPositions`, `oPositions`), difficulty selection (`tmDifficulty`), and 700ms delayed computer turns.
- `../../styles/games.css`: Scoped styles for the board well, animated SVG strokes, difficulty selector pills, and collapsible rules panel.

### 3. AI Difficulty Levels (Both Classic & 3-Marker Modes)
The difficulty selector is displayed automatically whenever playing against the computer (`1 Player` in Classic mode or `vs Computer` in 3-Marker mode) and hidden in `2 Players` mode:

| Difficulty | Classic 3×3 Behavior (`findBestClassicMove`) | 3-Marker FIFO Behavior (`findBestThreeMarkerMove`) |
| :--- | :--- | :--- |
| **Easy** | Plays random available cells (with a 25% chance to take an immediate 2-in-a-row win), offering casual openings for beginners. | Picks a random empty square (with a 25% chance to take an immediate FIFO-simulated win). |
| **Medium** | Takes immediate 2-in-a-row wins for `O` and blocks immediate 2-in-a-row threats from `X`; otherwise chooses randomly. | Simulates 1-step FIFO removal to take immediate wins or block `X`'s immediate wins, then prioritizes center (`4`), corners (`0, 2, 6, 8`), and edges. |
| **Hard** | **Unbeatable Full-Depth Minimax** with alpha-beta pruning (`10 - depth` / `depth - 10`) and randomized tie-breaking among optimal moves. | **Multi-Ply FIFO-Aware Minimax** with alpha-beta pruning (5-ply lookahead simulating exact `oPositions` and `xPositions` sliding queues). |

### 4. In-App "How to Play" Guide
- Clicking **How to Play** in the top banner or expanding the `How to Play` bar beneath the mode switcher reveals a 3-step breakdown tailored dynamically to the active variant (**Classic 3×3 Rules** or **3-Marker FIFO Rules**).

### 5. Customization Guide
- **Adjust 3-Marker AI Search Depth:** Modify `const searchDepth = 5;` inside `findBestThreeMarkerMove` in `src/projects/tic-tac-toe/gameEngine.ts`.
- **Adjust 3-Marker AI Thinking Delay:** Edit the `700` ms timeout in `src/projects/tic-tac-toe/useThreeMarkerTicTacToe.ts`.
- **Modify Board & Rules Styling:** Edit `.ttt-board-shell`, `.ttt-difficulty-bar`, and `.game-rules-card` in `src/styles/games.css`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
لعبة **إكس-أو (Tic-Tac-Toe)** هي لعبة تكتيكية ثنائية الطور مبنية على محرك منطقي نقي (`gameEngine.ts`) وتدعم ثلاثة مستويات صعوبة للذكاء الاصطناعي (**سهل Easy**، **متوسط Medium**، **صعب Hard**) في كلا الطورين، بالإضافة إلى دليل قواعد مدمج (**How to Play**):
1. **الطور الكلاسيكي (`Classic 3×3`):** اللعب على شبكة $3 \times 3$ ضد الكمبيوتر (`1 Player`) أو ضد لاعب آخر (`2 Players`) مع حفظ حالة اللوحتين بشكل مستقل عند التبديل بينهما.
2. **طور الثلاث قطع (`3-Marker Mode`):** طور تكتيكي يمنع التعادل؛ حيث يمتلك كل لاعب **3 قطع كحد أقصى** على اللوحة. عند امتلاك 3 قطع، تُميَّز القطعة الأقدم بحدود متقطعة وشارة `NEXT OUT`، وعند وضع القطعة الرابعة تختفي القطعة الأقدم فوراً بنظام الطابور (`FIFO`).

### 2. مستويات صعوبة الذكاء الاصطناعي (AI Difficulty)
يظهر شريط اختيار الصعوبة تلقائياً عند اللعب ضد الكمبيوتر ويختفي في طور اللاعبين (`2 Players`):
- **سهل (Easy):** تحركات عشوائية تمنح المبتدئين فرصاً متعددة للفوز.
- **متوسط (Medium):** يقتنص الفرص المباشرة للفوز ويصد التهديدات المباشرة للاعب، ويفضل المركز والزوايا في طور الثلاث قطع.
- **صعب (Hard):** يعتمد على خوارزمية **Minimax** مع تقليم Alpha-Beta؛ في الطور الكلاسيكي لا يمكن هزيمته، وفي طور الثلاث قطع يحاكي حركة طابور القطع (`FIFO`) لعدة خطوات قادمة.

### 3. دليل طريقة اللعب المدمج (How to Play)
- يتضمن التطبيق بطاقة قابلة للطي والفتح (`How to Play`) تشرح قواعد الطور النشط حالياً (الطور الكلاسيكي أو طور الثلاث قطع) بشكل مبسط ومتناسق مع الوضعين الداكن والفاتح.

### 4. كيفية التخصيص
- لتعديل خوارزميات الذكاء الاصطناعي أو عمق البحث، راجع الدالتين `findBestClassicMove` و`findBestThreeMarkerMove` في `src/projects/tic-tac-toe/gameEngine.ts`.
- لتعديل تنسيقات اللوحة وشريط الصعوبة ودليل القواعد، راجع الملف `src/styles/games.css`.

</div>
