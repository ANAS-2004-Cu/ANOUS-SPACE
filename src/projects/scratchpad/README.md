# Scratchpad · المفكرة السريعة

**Route / المسار:** `/scratchpad`  
**Accent / الهوية اللونية:** `terracotta`

---

## English Documentation

### 1. Overview
**Scratchpad** is a multi-tab local notes workspace designed for rapid drafting, code snippets, and daily scratch text without server round-trips. All content is persisted automatically in browser `localStorage` as you type.

### 2. File Structure
- `ScratchpadPage.tsx`: View component rendering the `WorkspaceLayout`, `ToolBanner`, tab strip, action toolbar, editor `<textarea>`, and bottom telemetry bar.
- `useScratchpad.ts`: Custom React hook managing tab state, legacy migration, auto-save persistence, text statistics, and `.txt` file downloads.
- `../../styles/scratchpad.css`: Scoped styles for the tab strip, editor surface, and status bar.

### 3. Inputs, Outputs & Core Features
- **Multi-Tab Management:**
  - Create up to **8 tabs** (`MAX_TABS = 8`).
  - Switch active tabs instantaneously.
  - Inline tab title input (up to `maxLength={40}`).
  - Close any tab (`×`); if the last remaining tab is closed, a fresh `Note 1` tab is automatically created.
- **Editor & Actions:**
  - Copy current tab content to clipboard (`copyText`).
  - Download current tab as a sanitized `<tab-title>.txt` file using `Blob` and `URL.createObjectURL`.
  - Clear current tab content with a confirmation modal (`showAlert`) when content is non-empty.
- **Live Telemetry (`computeStats`):**
  - Calculates real-time `words`, `chars`, and `lines` counts plus a relative `Saved HH:MM:SS` timestamp.

### 4. State & Storage Persistence (`localStorage`)
| Key | Type | Description |
| :--- | :--- | :--- |
| `anous_scratchpad_tabs_v2` | `NoteTab[]` (JSON) | Array of `{ id, title, content, updatedAt }` objects. |
| `anous_scratchpad_active_v2` | `string` | ID of the currently selected tab. |
| `anous_scratchpad_v1` | `string` (Legacy) | Automatically migrated into the first `v2` tab on initial load and then deleted via `localStorage.removeItem`. |

### 5. Customization Guide
- **Change Maximum Tabs:** Modify `const MAX_TABS = 8;` in `src/projects/scratchpad/useScratchpad.ts`.
- **Change Editor Height or Font:** Adjust `.scratchpad-textarea` in `src/styles/scratchpad.css`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
أداة **المفكرة السريعة (Scratchpad)** هي مساحة عمل نصية متعددة التبويبات لحفظ الملاحظات السريعة ومسودات النصوص والأكواد مباشرة داخل المتصفح مع حفظ تلقائي فوري دون الحاجة إلى خادم خارجي.

### 2. هيكل الملفات
- `ScratchpadPage.tsx`: واجهة المستخدم التي تعرض شريط التبويبات، شريط الأدوات، مساحة التحرير النصية، وشريط الإحصائيات السفلي.
- `useScratchpad.ts`: الخطاف البرمجي المسؤول عن إدارة التبويبات، الحفظ التلقائي، ترحيل البيانات القديمة، وحساب إحصائيات النص.
- `../../styles/scratchpad.css`: التنسيقات الخاصة بالمفكرة.

### 3. المدخلات والمخرجات والميزات الأساسية
- **إدارة التبويبات:** إمكانية فتح حتى **8 تبويبات** (`MAX_TABS = 8`)، وتغيير عنوان كل تبويب، وإغلاق أي تبويب (وعند إغلاق التبويب الأخير يتم إنشاء تبويب جديد تلقائياً).
- **الأدوات السريعة:** نسخ النص إلى الحافظة (`Copy`)، تنزيل الملاحظة كملف نصي (`.txt`)، أو مسح محتوى التبويب الحالي مع نافذة تأكيد.
- **الإحصائيات الفورية:** حساب عدد الكلمات (`Words`) والأحرف (`Chars`) والأسطر (`Lines`) ووقت آخر حفظ تلقائي.

### 4. التخزين المحلي (`localStorage`)
- `anous_scratchpad_tabs_v2`: مصفوفة JSON تحتوي على جميع التبويبات المحفوظة.
- `anous_scratchpad_active_v2`: معرّف التبويب النشط حالياً.
- `anous_scratchpad_v1`: مفتاح الإصدار الأول القديم (يتم استيراده تلقائياً إلى الإصدار الثاني ثم حذفه).

### 5. كيفية التخصيص
- لتغيير الحد الأقصى لعدد التبويبات، عدّل قيمة `MAX_TABS` في الملف `src/projects/scratchpad/useScratchpad.ts`.
- لتعديل تصميم المحرر أو حجم الخط، عدّل الفئة `.scratchpad-textarea` في الملف `src/styles/scratchpad.css`.

</div>
