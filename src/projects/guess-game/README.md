# Number Guess (0–99) · لعبة تخمين الرقم

**Route / المسار:** `/guess-game`  
**Accent / الهوية اللونية:** `ochre`

---

## English Documentation

### 1. Overview
**Number Guess (0–99)** is a deductive numerical puzzle where players attempt to discover a hidden whole number between **0 and 99** within **10 tries**. Every guess provides directional feedback (`Too Low ↑` or `Too High ↓`), proximity temperature hints (`Very Close ≤ 10`, `Getting Close ≤ 25`, or `More than 25 away`), and dynamically narrows the visual **Possible Range (`00–99`)** window. It also includes an interactive in-app **"How to Play"** rules guide.

### 2. File Structure
- `GuessGamePage.tsx`: View component rendering the `WorkspaceLayout`, `ToolBanner`, collapsible **How to Play** rules card, live status & narrowed range card, numeric guess input with remaining-tries progress bar, and color-coded guess history chips.
- `useGuessGame.ts`: Custom React hook managing secret number generation (`0–99`), attempt validation, directional/proximity feedback calculation, and live `minBound`–`maxBound` range deduction.
- `../../styles/games.css`: Styles for the large number tile, animated range window track, attempts progress bar, history badges, and collapsible rules card.

### 3. Inputs, Outputs & Game Rules (`useGuessGame.ts`)
- **Range & Attempt Limit:**
  - Secret target integer: $0 \le \text{target} \le 99$ (`Math.floor(Math.random() * 100)`).
  - Maximum attempts per round: `MAX_TRIES = 10`.
- **Input Validation:**
  - Empty submissions (`feedback = 'empty'`) or numbers outside `0–99` (`feedback = 'out-of-range'`) display helpful guidance without consuming a try.
- **Directional & Proximity Hints (`HintLevel` & `GuessFeedback`):**
  - **Solved (`victory` / `won`):** Exact match (`distance === 0`), reveals target in sage green.
  - **Very Close (`so-higher` / `so-lower` / `very-close`):** Within **10** of the secret number ($1 \le \text{distance} \le 10$).
  - **Getting Close (`close`):** Within **25** of the secret number ($11 \le \text{distance} \le 25$).
  - **Far (`far`):** More than **25** away ($\text{distance} > 25$).
- **Live Narrowed Range (`minBound` – `maxBound`):**
  - Automatically computes the tightest valid interval $[ \text{minBound}, \text{maxBound} ] \subseteq [0, 99]$ from all previous guesses and renders it on a proportional progress bar.

### 4. In-App "How to Play" Guide
- Clicking **How to Play** in the banner or toggling the `How to Play · Number Guess (0–99) Rules` bar expands a 3-card guide explaining the `0–99` range, `10-try` limit, directional/proximity hints, and live range bar.

### 5. Customization Guide
- **Change Attempt Limit:** Update `export const MAX_TRIES = 10;` in `src/projects/guess-game/useGuessGame.ts`.
- **Adjust Proximity Thresholds:** Update the distance checks (`distance <= 10`, `distance <= 25`) in `src/projects/guess-game/useGuessGame.ts` and `GuessGamePage.tsx`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
لعبة **تخمين الرقم (Number Guess 0–99)** هي لعبة ألغاز استنتاجية يحاول فيها اللاعب اكتشاف رقم سري عشوائي بين **0 و 99** خلال **10 محاولات** كحد أقصى. بعد كل تخمين، تقدم اللعبة تلميحاً اتجاهياً (`أعلى ↑` أو `أقل ↓`) ومؤشر تقارب لوني، وتقوم بتضييق شريط **النطاق المحتمل (`Possible Range 00–99`)** تلقائياً، مع توفير دليل قواعد مدمج (**How to Play**) داخل الصفحة.

### 2. هيكل الملفات
- `GuessGamePage.tsx`: واجهة المستخدم (دليل طريقة اللعب القابل للطي، بطاقة الحالة والنطاق المحتمل، حقل الإدخال وشريط المحاولات المتبقية، وسجل التخمينات السابقة).
- `useGuessGame.ts`: الخطاف البرمجي المسؤول عن توليد الرقم السري (`0–99`)، التحقق من المدخلات، حساب المسافة والتلميحات، وتحديث حدود النطاق (`minBound` و`maxBound`).
- `../../styles/games.css`: تنسيقات اللعبة وشريط النطاق ودليل القواعد.

### 3. قواعد اللعبة ومؤشرات التقارب
- **النطاق والحدود:** الرقم السري عدد صحيح من `0` إلى `99`، وعدد المحاولات المسموحة هو `10` محاولات (`MAX_TRIES = 10`).
- **مستويات التلميح:**
  - **قريب جداً (`Very Close`):** الفرق بين تخمينك والرقم السري $\le 10$.
  - **قريب (`Getting Close`):** الفرق بين $11$ و$25$.
  - **بعيد (`More than 25 away`):** الفرق أكبر من $25$.
- **تضييق النطاق التلقائي:** يتم تحديث الحد الأدنى (`minBound`) والحد الأقصى (`maxBound`) تلقائياً بعد كل محاولة لمساعدتك على حصر الرقم الصحيح بسرعة.

### 4. كيفية التخصيص
- لتغيير عدد المحاولات المسموحة، عدّل الثابت `MAX_TRIES = 10` في الملف `src/projects/guess-game/useGuessGame.ts`.

</div>
