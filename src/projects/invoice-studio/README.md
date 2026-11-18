# Quotation Studio · استوديو عروض الأسعار

**Route / المسار:** `/invoice-studio` *(Protected by `<VaultGuard>` / محمي بواسطة الخزنة الخاصة)*  
**Accent / الهوية اللونية:** `ochre`

---

## English Documentation

### 1. Overview
**Quotation Studio** is a private, Vault-gated RTL Arabic quotation generator (`عرض سعر`) built natively for **ANOUS-SPACE**. It provides a tactile dual-theme (`dark` / `light`) editing workspace, flexible unit management, an archived quotation manager, and a crisp A4 black-on-white print and export pipeline (PNG with embedded `Cairo` fonts + selectable vector PDF).

### 2. File Structure
- `invoiceModel.ts`: Pure TypeScript types (`Quotation`, `QuotationItem`, `QuotationSettings`), default settings, VAT & row-total math, and Latin-digit Arabic formatters (`ar-EG-u-nu-latn`).
- `useInvoiceStudio.ts`: Custom React hook managing draft autosave, reactive 50-step Undo/Redo history, row manipulation (`addItem`, `updateItem`, `duplicateItem`, `removeItem`, `moveItem`), saved archive CRUD, and settings persistence.
- `exportInvoice.ts`: Export utilities for:
  - **PNG (`exportQuotationImage`):** Mounts `PrintTemplate` off-screen, embeds local `/fonts/Cairo-Regular.ttf` & `/fonts/Cairo-Bold.ttf` as inline `@font-face` base64 CSS, and renders a 3× pixel-ratio canvas via `html-to-image`.
  - **Vector PDF (`exportQuotationPdf`):** Generates selectable Arabic PDF files via `@react-pdf/renderer` using bundled `Cairo` fonts.
- `InvoiceStudioPage.tsx`: Main `WorkspaceLayout` page (`dir="rtl"`) with three segmented views: **المحرر (Editor)**, **الأرشيف (Archive)**, and **الإعدادات (Settings)**.
- `components/`:
  - `QuotationToolbar.tsx`: Primary action strip (Add Item, Delete Selected, Save to Archive, New Quotation, Preview, Print, PNG, PDF, Undo/Redo).
  - `QuotationEditor.tsx`: Company header preview, lightweight quotation metadata (`number`, `date`, optional `customerName`, VAT toggle/rate), keyboard- & touch-friendly line-items grid, notes, and totals table.
  - `PrintTemplate.tsx`: Static A4 paper template (`PrintTemplate`) and body-level print portal (`PrintPortal`).
  - `PdfDocument.tsx`: Vector PDF document matching the exact RTL column order and left-aligned totals layout of `PrintTemplate`.
  - `PreviewModal.tsx`: Responsive A4 preview modal dynamically scaled via `ResizeObserver`.
  - `ArchivePanel.tsx`: Searchable archive of saved quotations with open, duplicate, and delete actions.
  - `SettingsPanel.tsx`: Customizable business name, optional subtitle/contact, optional Tax ID, currency, default VAT rate, VAT default toggle, custom preset units, and default quotation notes.
- `../../styles/invoice-studio.css`: Scoped studio styles, mobile card table rules, and `@media print` A4 page setup.

### 3. LocalStorage Persistence Keys
- `anous_quotation_settings_v1`: Company identity, VAT defaults, currency, preset units, and default notes.
- `anous_quotation_draft_v1`: Active quotation draft autosaved on every edit.
- `anous_quotation_archive_v1`: Array of saved quotations sorted by `updatedAt`.

### 4. Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save current quotation to Archive.
- `Ctrl/Cmd + P`: Print A4 quotation.
- `Ctrl/Cmd + E`: Export Vector PDF.
- `Ctrl/Cmd + Shift + I`: Export 3× PNG image.
- `Ctrl/Cmd + Z` / `Ctrl/Cmd + Y`: Undo / Redo (when not typing inside a text input).
- `ArrowUp` / `ArrowDown` / `Enter` inside the table: Navigate cells or append a new row on the last row.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
**استوديو عروض الأسعار (Quotation Studio)** هو أداة خاصة محمية بالخزنة (`VaultGuard`) مصممة بالكامل باللغة العربية (`RTL`) لإنشاء وإدارة عروض الأسعار الاحترافية داخل المتصفح. تدعم الأداة الوضعين الداكن والفاتح، مع أرشيف محلي محفوظ، وطباعة قياسية بمقاس `A4`، وتصدير ملفات **PDF متجهية** وصور **PNG** عالية الدقة مع تضمين خط **Cairo** لضمان جودة النصوص العربية.

### 2. هيكل الملفات
- `invoiceModel.ts`: نماذج البيانات والدوال الحسابية النقية لحساب الإجمالي والضريبة وتنسيق الأرقام والتواريخ.
- `useInvoiceStudio.ts`: الخطاف البرمجي (Custom Hook) لإدارة المسودة النشطة، وسجل التراجع/الإعادة (`Undo/Redo`) التفاعلي، والأرشيف المحلي، والإعدادات.
- `exportInvoice.ts`: محرك التصدير المسؤول عن توليد صور `PNG` عالية الدقة مع تضمين خط `Cairo` محلياً، وتوليد ملفات `PDF` نصية قابلة للتحديد.
- `InvoiceStudioPage.tsx`: الصفحة الرئيسية للأداة وتحتوي على ثلاثة تبويبات: **المحرر**، **الأرشيف**، و**الإعدادات**.
- `components/`:
  - `QuotationToolbar.tsx`: شريط الأدوات (إضافة صنف، حذف المحدد، الحفظ بالأرشيف، عرض جديد، معاينة، طباعة، PNG، PDF، التراجع والإعادة).
  - `QuotationEditor.tsx`: محرر عرض السعر مع دعم الوحدات المخصصة، وأزرار تحريك الصفوف للأعلى والأسفل (للهواتف)، والتنقل بالأسهم.
  - `PrintTemplate.tsx` و `PdfDocument.tsx`: قوالب التصدير والطباعة المتطابقة بتصميم `A4` أبيض وأسود حاد.
  - `PreviewModal.tsx`: نافذة معاينة متجاوبة تُكيّف حجم ورقة `A4` تلقائياً مع عرض الشاشة.
  - `ArchivePanel.tsx`: أرشيف للبحث في العروض المحفوظة وإعادة فتحها أو نسخها أو حذفها.
  - `SettingsPanel.tsx`: إعدادات الشركة والضريبة والعملة والوحدات المقترحة والملاحظات الافتراضية.

### 3. مفاتيح التخزين المحلي (`localStorage`)
- `anous_quotation_settings_v1`: إعدادات النشاط والضريبة والوحدات.
- `anous_quotation_draft_v1`: المسودة الحالية المحفوظة تلقائياً.
- `anous_quotation_archive_v1`: قائمة عروض الأسعار المحفوظة في الأرشيف.

### 4. اختصارات لوحة المفاتيح
- `Ctrl + S`: حفظ العرض في الأرشيف.
- `Ctrl + P`: طباعة عرض السعر (`A4`).
- `Ctrl + E`: تصدير ملف `PDF`.
- `Ctrl + Shift + I`: تصدير صورة `PNG`.
- `Enter` / `ArrowUp` / `ArrowDown` داخل الجدول: التنقل السريع بين الخلايا أو إضافة صف جديد في نهاية الجدول.

</div>
