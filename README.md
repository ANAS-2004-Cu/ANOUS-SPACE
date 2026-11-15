# ANOUS-SPACE · أنوس سبيس

**Personal Web Tools, Disposable Email Workspace & Interactive Mini-Apps Hub**  
**منصة الأدوات الرقمية الشخصية، البريد المؤقت متعدد المزودين، والتطبيقات التفاعلية المصغرة**

---

## English Documentation

### 1. Overview
**ANOUS-SPACE** is a fast, keyboard-first web workspace built with React 19, TypeScript, and Vite. Designed around an **Artisanal Warm Dark** aesthetic (warm obsidian surfaces, cream stone light mode, editorial serif headings, and crisp monospace telemetry), it unifies daily productivity utilities, a 9-provider disposable email client, interactive browser games, and external engineering portfolio projects under a single cohesive shell.

### 2. Tech Stack
- **Frontend Framework:** React 19 + TypeScript 5.8
- **Routing:** React Router v7 (`react-router-dom`)
- **Build & Dev Server:** Vite 6 with custom local API proxy middleware (`vite.config.ts`)
- **HTTP Client:** Axios + Native `fetch`
- **Icons:** `react-icons/fi` (Feather Icons) + custom geometric vector emblems (`ToolEmblem`)
- **Styling:** Hand-crafted CSS token architecture (`src/styles/tokens.css`, `base.css`, `primitives.css`, and scoped tool stylesheets)
- **Deployment & Serverless Edge Proxies:** Vercel (`vercel.json` + `api/*.ts` serverless functions)

### 3. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server (with built-in /api/* local proxy middleware)
npm run dev

# 3. Type-check the entire project
npx tsc --noEmit

# 4. Build for production
npm run build

# 5. Preview the production bundle locally
npm run preview
```

### 4. Global Keyboard Shortcuts

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Global (All Pages) | Open or close the global Command Palette |
| `1` – `9` | Hub Home (`/`) | Instantly launch the corresponding card in the project grid (when not typing in an input) |
| `ArrowUp` / `ArrowDown` | Command Palette | Navigate through matching tools, external links, and quick actions |
| `Enter` | Command Palette | Execute or open the highlighted command item |
| `Escape` | Global Modals | Close the active modal dialog or Command Palette |

### 5. Public Mini-Apps (Internal Workspace Tools)

| Mini-App | Route | Accent | Summary | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Scratchpad** | `/scratchpad` | `terracotta` | Multi-tab local notes workspace with instant auto-save, live word/character/line counters, and `.txt` export. | [`src/projects/scratchpad/README.md`](src/projects/scratchpad/README.md) |
| **Temp-Mail Client** | `/temp-mail` | `slate` | Unified disposable email hub supporting **9 providers** across REST, Query, and GraphQL protocols with live inbox polling, HTML/plain-text message viewer, and attachment downloads. | [`src/projects/temp-mail/README.md`](src/projects/temp-mail/README.md) |
| **Tic-Tac-Toe** | `/tic-tac-toe` | `ochre` | Dual-mode tactical grid game featuring **Classic Mode** (`3×3` PvP or Unbeatable Minimax AI) and **3-Marker Mode** (FIFO sliding window where each player holds at most 3 active pieces). | [`src/projects/tic-tac-toe/README.md`](src/projects/tic-tac-toe/README.md) |
| **Guess The Number** | `/guess-game` | `sage` | Deductive number-guessing challenge (1–100, 10 attempts) with directional proximity hints, attempt history badges, and persistent win/best-score telemetry. | [`src/projects/guess-game/README.md`](src/projects/guess-game/README.md) |

### 6. External Portfolio Projects Featured on the Hub
In addition to internal mini-apps, the Hub (`src/data/projects.ts`) indexes external web applications and repositories:
- **90+60 Chrome Extension** — Browser extension to control playback speed for lectures and online videos.
- **Prayer-Times** — Accurate Islamic prayer times web app with next-prayer countdown and location detection.
- ** Simple-Calculator** — Lightweight arithmetic calculator for quick everyday calculations.
- **2048 Game** — Classic sliding-tile puzzle game built for smooth keyboard and touch play.
- **To-Do-List** — Clean task manager for organizing daily priorities.
- **GitHub Profile (`@ANAS-2004-Cu`)** — Source repositories and open-source contributions.

### 7. Public Browser Storage Keys (`localStorage`)

| Key / Pattern | Owner | Purpose |
| :--- | :--- | :--- |
| `anous_theme` | `ThemeContext` | Persists active color theme (`'dark'` or `'light'`). |
| `anous_recent_tools` | `recentTools.ts` | Stores up to 4 recently visited internal tool IDs for the Hub's "Recently Used" strip. |
| `anous_scratchpad_tabs_v2` | `Scratchpad` | JSON array of saved note tabs (`id`, `title`, `content`, `updatedAt`). |
| `anous_scratchpad_active_v2` | `Scratchpad` | Active note tab ID. |
| `anous_scratchpad_v1` | `Scratchpad` | Legacy single-note storage key (automatically migrated into `v2` tabs on first load and removed). |
| `anous_tempmail_account_<provider>` | `Temp-Mail` | Active `TempAccount` JSON record per provider (`grabmail.io`, `catchmail.io`, `mail.tm`, `mail.gw`, `tempmail.io`, `inboxes.com`, `tempmail.lol`, `tempmail.plus`, `dropmail.me`, `guerrillamail`). |
| `anous_tempmail_messages_<provider>` | `Temp-Mail` | Locally cached inline message payloads for providers that deliver full bodies during inbox sync (`inboxes.com`, `tempmail.lol`, `dropmail.me`). |

### 8. Deep-Dive Technical Guides
- **[Architecture Guide (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)** — Routing, design tokens, shared UI primitives, global contexts, and serverless proxy mechanics.
- **[Developer Extension Guide (`docs/EXTENDING.md`)](docs/EXTENDING.md)** — Step-by-step instructions for adding new mini-apps, adding new Temp-Mail providers, registering external portfolio cards, and customizing styles.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
منصة **ANOUS-SPACE (أنوس سبيس)** هي مساحة عمل ويب سريعة تعتمد على اختصارات لوحة المفاتيح، مبنية باستخدام React 19 وTypeScript وVite. صُممت المنصة بنظام بصري دافئ (**Artisanal Warm Dark**) يجمع بين الوضع الداكن الدافئ والوضع الفاتح الكريمي، وتوحّد أدوات الإنتاجية اليومية، ومنصة البريد المؤقت المتعددة المزودين (9 مزودين)، والألعاب التفاعلية، ومشاريع المعرض البرمجية الخارجية ضمن واجهة موحدة.

### 2. التقنيات المستخدمة
- **إطار الواجهة الأمامية:** React 19 مع TypeScript 5.8
- **التوجيه (Routing):** مكتبة `react-router-dom` الإصدار السابع
- **خادم التطوير والبناء:** Vite 6 مع طبقة وسطية محلية (`vite.config.ts`) لمحاكاة نقاط نهاية `/api/*`
- **عميل الشبكة:** Axios بالإضافة إلى `fetch` القياسي
- **الأيقونات والشارات:** مكتبة `react-icons/fi` مع شعارات هندسية مخصصة (`ToolEmblem`)
- **التصميم والأنماط:** معمارية CSS مبنية على المتغيرات القياسية (`tokens.css`, `base.css`, `primitives.css`) وملفات أنماط مخصصة لكل أداة
- **النشر والوسطاء السحابيون:** Vercel (`vercel.json` مع دوال `api/*.ts`)

### 3. تشغيل المشروع محلياً

```bash
# 1. تثبيت الحزم البرمجية
npm install

# 2. تشغيل خادم التطوير المحلي (يشمل وسطاء /api/* تلقائياً)
npm run dev

# 3. فحص الأنواع البرمجية (TypeScript)
npx tsc --noEmit

# 4. بناء نسخة الإنتاج
npm run build

# 5. معاينة نسخة الإنتاج محلياً
npm run preview
```

### 4. اختصارات لوحة المفاتيح العامة

| الاختصار | النطاق | الوظيفة |
| :--- | :--- | :--- |
| `Ctrl + K` أو `Cmd + K` | جميع الصفحات | فتح أو إغلاق لوحة الأوامر السريعة (Command Palette) |
| `1` – `9` | الصفحة الرئيسية (`/`) | تشغيل البطاقة المقابلة للرقم فوراً (طالما لا يوجد حقل إدخال نشط) |
| `ArrowUp` / `ArrowDown` | لوحة الأوامر | التنقل بين الأدوات والروابط والإجراءات المطابقة |
| `Enter` | لوحة الأوامر | فتح الأداة أو تنفيذ الأمر المحدد |
| `Escape` | النوافذ المنبثقة | إغلاق النافذة المنبثقة النشطة أو لوحة الأوامر |

### 5. التطبيقات المصغرة العامة (Public Mini-Apps)

| الأداة | المسار | اللون المميز | الوصف المختصر | التوثيق المفصل |
| :--- | :--- | :--- | :--- | :--- |
| **المفكرة السريعة (Scratchpad)** | `/scratchpad` | `terracotta` | مساحة ملاحظات متعددة التبويبات مع حفظ تلقائي فوري، عداد كلمات وأحرف وأسطر، وتصدير ملفات `.txt`. | [`src/projects/scratchpad/README.md`](src/projects/scratchpad/README.md) |
| **عميل البريد المؤقت (Temp-Mail)** | `/temp-mail` | `slate` | مركز بريد مؤقت موحد يدعم **9 مزودين** عبر بروتوكولات REST وQuery وGraphQL مع تحديث تلقائي لصندوق الوارد، عارض رسائل HTML/نص عادي، وتحميل المرفقات. | [`src/projects/temp-mail/README.md`](src/projects/temp-mail/README.md) |
| **لعبة إكس-أو (Tic-Tac-Toe)** | `/tic-tac-toe` | `ochre` | لعبة تكتيكية ثنائية الطور تتضمن **الطور الكلاسيكي** (ضد لاعب آخر أو ذكاء اصطناعي لا يُهزم بخوارزمية Minimax) و**طور الثلاث قطع (3-Marker FIFO)** الذي يمنع التعادل تماماً. | [`src/projects/tic-tac-toe/README.md`](src/projects/tic-tac-toe/README.md) |
| **تخمين الرقم (Guess Game)** | `/guess-game` | `sage` | تحدي استنتاج الرقم السري (بين 1 و100 خلال 10 محاولات) مع تلميحات تقارب ذكية وسجل محاولات وإحصائيات أفضل نتيجة. | [`src/projects/guess-game/README.md`](src/projects/guess-game/README.md) |

### 6. مفاتيح التخزين المحلي العامة (`localStorage`)

| المفتاح / النمط | الأداة المالكة | الوظيفة |
| :--- | :--- | :--- |
| `anous_theme` | `ThemeContext` | حفظ المظهر المختار (`'dark'` أو `'light'`). |
| `anous_recent_tools` | `recentTools.ts` | تخزين آخر 4 أدوات داخلية تم استخدامها لعرضها في شريط "المستخدمة مؤخراً". |
| `anous_scratchpad_tabs_v2` | `Scratchpad` | مصفوفة JSON لتبويبات الملاحظات المحفوظة. |
| `anous_scratchpad_active_v2` | `Scratchpad` | معرّف التبويب النشط حالياً في المفكرة. |
| `anous_scratchpad_v1` | `Scratchpad` | مفتاح الإصدار القديم للمفكرة (يتم ترحيله تلقائياً إلى الإصدار الثاني ثم حذفه). |
| `anous_tempmail_account_<provider>` | `Temp-Mail` | بيانات الحساب النشط (`TempAccount`) لكل مزود بريد مؤقت. |
| `anous_tempmail_messages_<provider>` | `Temp-Mail` | تخزين محلي مؤقت لمحتوى الرسائل للمزودين الذين يرسلون نص الرسالة ضمن قائمة صندوق الوارد (`inboxes.com`, `tempmail.lol`, `dropmail.me`). |

### 7. الأدلة التقنية المتقدمة
- **[دليل المعمارية البرمجية (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)** — شرح تفصيلي للتوجيه، نظام التصميم، المكونات المشتركة، السياقات العامة (Contexts)، ووسطاء الـ API.
- **[دليل التوسعة والتطوير (`docs/EXTENDING.md`)](docs/EXTENDING.md)** — خطوات عملية لإضافة أداة جديدة، أو إضافة مزود بريد مؤقت جديد، أو إضافة مشروع خارجي، أو تعديل نظام التصميم بأمان.

</div>
