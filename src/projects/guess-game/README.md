# Guess The Number · لعبة تخمين الرقم

**Route / المسار:** `/guess-game`  
**Accent / الهوية اللونية:** `sage`

---

## English Documentation

### 1. Overview
**Guess The Number** is a deductive numerical game where players attempt to identify a secret integer between **1 and 100** within **10 attempts**. Each guess produces a directional hint (`↑ Higher` or `↓ Lower`) and a proximity temperature indicator (`Very Close!` when $|\text{guess} - \text{secret}| \le 5$, or `Getting Warm` when $\le 15$).

### 2. File Structure
- `GuessGamePage.tsx`: View component rendering the telemetry scoreboard, feedback banner, numeric input form, and chronological guess history pills.
- `useGuessGame.ts`: Custom hook encapsulating secret number generation, input validation, attempt evaluation, and session statistics (`gamesWon`, `bestAttempts`).
- `../../styles/games.css`: Styles for the feedback banner, input bar, and history chips.

### 3. Inputs, Outputs & Game Rules (`useGuessGame.ts`)
- **Configuration Constants:**
  - `MIN_NUMBER = 1`
  - `MAX_NUMBER = 100`
  - `MAX_ATTEMPTS = 10`
- **Validation Rules:**
  - Non-numeric or out-of-range inputs (`< 1` or `> 100`) trigger a warning toast via `AlertContext` without consuming an attempt.
  - Duplicate guesses already present in `history` trigger an informational toast (`Already Guessed`) without consuming an attempt.
- **Outcome & Feedback Logic:**
  - **Exact Match (`num === secretNumber`):** Sets `gameOver = true`, `won = true`, increments `gamesWon`, updates `bestAttempts` if fewer attempts were used, and displays a celebratory banner.
  - **Exhausted Attempts (`nextHistory.length >= MAX_ATTEMPTS`):** Sets `gameOver = true`, `won = false`, and reveals the secret number.
  - **Directional + Proximity Hint:** Appends `{ value, direction: 'higher' | 'lower', distance }` to `history` (newest first).

### 4. State & Storage Persistence
- Round state (`secretNumber`, `history`, `gameOver`, `won`) and multi-round session telemetry (`gamesWon`, `bestAttempts`) are managed in React state via `useGuessGame`.
- Visiting `/guess-game` records `'guess-game'` in `localStorage` under `anous_recent_tools`.

### 5. Customization Guide
- **Change Number Range or Attempt Limit:** Update `MIN_NUMBER`, `MAX_NUMBER`, or `MAX_ATTEMPTS` at the top of `src/projects/guess-game/useGuessGame.ts`.
- **Adjust Proximity Thresholds:** Modify the distance checks (`distance <= 5`, `distance <= 15`) inside `submitGuess` in `src/projects/guess-game/useGuessGame.ts`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
لعبة **تخمين الرقم (Guess The Number)** هي لعبة استنتاجية يحاول فيها اللاعب اكتشاف رقم سري عشوائي بين **1 و 100** خلال **10 محاولات** كحد أقصى، مع الحصول على تلميحات اتجاهية (`أعلى ↑` أو `أقل ↓`) ومؤشر مدى القرب من الرقم الصحيح بعد كل محاولة.

### 2. هيكل الملفات
- `GuessGamePage.tsx`: مكون الواجهة لعرض لوحة الإحصائيات، لافتة التلميحات، حقل الإدخال، وسجل المحاولات السابقة.
- `useGuessGame.ts`: الخطاف البرمجي الذي يدير توليد الرقم السري، التحقق من المدخلات، وحساب النتائج.
- `../../styles/games.css`: تنسيقات اللعبة وشرائح سجل التخمينات.

### 3. قواعد اللعبة والمنطق البرمجي
- **النطاق والحدود:** الرقم السري بين `1` (`MIN_NUMBER`) و`100` (`MAX_NUMBER`)، والحد الأقصى للمحاولات هو `10` (`MAX_ATTEMPTS`).
- **التحقق الذكي:** الإدخالات غير الرقمية أو الخارجة عن النطاق أو المكررة لا تستهلك محاولة وتُظهر تنبيهاً للمستخدم.
- **مؤشرات التقارب:**
  - إذا كان الفرق $\le 5$: يظهر تلميح `Very Close!` (قريب جداً).
  - إذا كان الفرق $\le 15$: يظهر تلميح `Getting Warm` (اقتربت).

### 4. كيفية التخصيص
- لتغيير مجال الأرقام أو عدد المحاولات المسموحة، عدّل الثوابت `MIN_NUMBER` و`MAX_NUMBER` و`MAX_ATTEMPTS` في بداية الملف `src/projects/guess-game/useGuessGame.ts`.

</div>
