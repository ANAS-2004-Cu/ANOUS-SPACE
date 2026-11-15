# Extending ANOUS-SPACE · دليل توسعة وتطوير المنصة

This step-by-step developer playbook explains how to add new public mini-apps, integrate new Temp-Mail providers, register external portfolio projects, configure private Vault-gated tools, and safely customize design tokens.

---

## Part 1 — English Developer Guide

### 1. How to Add a Brand-New Public Mini-App

Follow these 5 steps to create and wire a new internal mini-app (for example, `json-formatter` at `/json-formatter`):

#### Step 1: Create the Mini-App Folder (`src/projects/json-formatter/`)
Create your hook/logic and page component inside `src/projects/json-formatter/`:

```tsx
// src/projects/json-formatter/JsonFormatterPage.tsx
import React, { useEffect } from 'react';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface JsonFormatterPageProps {
  onOpenCommandPalette: () => void;
}

export const JsonFormatterPage: React.FC<JsonFormatterPageProps> = ({ onOpenCommandPalette }) => {
  useEffect(() => {
    recordRecentProject('json-formatter');
  }, []);

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="JSON Formatter"
      accent="terracotta"
      width="medium"
    >
      <ToolBanner
        toolId="json-formatter"
        accent="terracotta"
        eyebrow="Developer Utility"
        title="JSON Formatter"
        description="Validate, pretty-print, and minify JSON payloads locally."
      />
      <Surface accent="terracotta" padded>
        {/* Tool UI */}
      </Surface>
    </WorkspaceLayout>
  );
};
```

#### Step 2: Register an Emblem Icon (Optional, in `src/shared/ui/ToolEmblem.tsx`)
Add a `case 'json-formatter':` inside `renderGlyph(toolId)` in `src/shared/ui/ToolEmblem.tsx` if you want a custom SVG vector icon; otherwise it gracefully falls back to a clean default glyph.

#### Step 3: Add the Tool to the Public Catalog (`src/data/projects.ts`)
Append an entry to `INTERNAL_TOOLS` in `src/data/projects.ts`:

```ts
{
  id: 'json-formatter',
  title: 'JSON Formatter',
  description: 'Validate, pretty-print, and minify JSON payloads in the browser.',
  category: 'Utilities',
  type: 'internal',
  to: '/json-formatter',
  badge: 'Utility',
  accent: 'terracotta',
  meta: ['Pretty Print', 'Minify'],
  keywords: ['json', 'format', 'validate', 'lint'],
}
```
Because `HubHome` and `CommandPalette` read directly from `PUBLIC_PROJECTS` (`[...INTERNAL_TOOLS, ...EXTERNAL_PROJECTS]`), your tool will automatically appear on the Hub grid, category filter tabs, "Recently Used" strip, and `Ctrl+K` Command Palette.

#### Step 4: Mount the Route (`src/App.tsx`)
Import `JsonFormatterPage` in `src/App.tsx` and register its `<Route>` inside `<Routes>`:

```tsx
<Route
  path="/json-formatter"
  element={<JsonFormatterPage onOpenCommandPalette={openPalette} />}
/>
```

#### Step 5: Add Scoped Styles & Documentation
- If the mini-app requires custom layout rules beyond `primitives.css`, create `src/styles/json-formatter.css` and import it in `src/main.tsx`.
- Create `src/projects/json-formatter/README.md` documenting its features, state, and customization points.

---

### 2. How to Add a New Provider Inside Temp-Mail

Temp-Mail uses a uniform **Provider Adapter Pattern** (`MailProviderAdapter` in `src/projects/temp-mail/types.ts`). To add a new provider (e.g., `examplemail.com`):

1. **Register the Provider ID (`src/projects/temp-mail/types.ts`):**
   - Add `'examplemail.com'` to the `MailProviderId` union type.
   - Update `normalizeProviderId()` so `?provider=examplemail.com` resolves to `'examplemail.com'`.
2. **Add Storage Keys (`src/projects/temp-mail/storage.ts`):**
   - Add `'examplemail.com': 'anous_tempmail_account_examplemail'` to `ACCOUNT_STORAGE_KEYS`.
   - If the provider returns full message bodies inline during inbox sync, also add an entry to `MESSAGE_CACHE_KEYS`.
3. **Create the Serverless Proxy & Dev Middleware (if CORS-restricted):**
   - Create `api/examplemail.ts` following the self-contained pattern in `api/grabmail.ts` or `api/catchmail.ts`.
   - Register `/api/examplemail` inside `vite.config.ts` using `createPathProxyMiddleware` or `createQueryProxyMiddleware`.
4. **Implement the Provider Adapter (`src/projects/temp-mail/providers/examplemail.ts`):**
   - Export an object implementing `MailProviderAdapter` (`id`, `label`, `capabilities`, `getDomains`, `createAccount`, `getStoredAccount`, `fetchMessages`, `fetchMessageDetail`, `deleteMessage`, `resetSession`).
   - Use `requestJson` / `ProviderHttpError` from `./http` and `readAccountStorage` / `writeAccountStorage` / `clearAccountStorage` from `../storage`.
5. **Wire into the Provider Registry (`src/projects/temp-mail/providers/index.ts`):**
   - Add `'examplemail.com'` to `PROVIDER_ORDER`.
   - Add its metadata and capabilities to `PROVIDERS_META`.
   - Add the adapter instance to `PROVIDER_ADAPTERS`.
   - Update the provider count in `src/data/projects.ts` if desired.

---

### 3. How to Add an External Portfolio Project Card to the Hub

To showcase a new external website, deployed web app, or GitHub repository on the Hub:

1. Open `src/data/projects.ts` and add a new object to `EXTERNAL_PROJECTS`:
   ```ts
   {
     id: 'ext-my-project',
     title: 'My External App',
     description: 'Concise description of what the external project does.',
     category: 'Utilities', // 'Utilities' | 'Games'
     type: 'external',
     href: 'https://example.com',
     badge: 'Web App',
     accent: 'slate',       // 'terracotta' | 'slate' | 'ochre' | 'sage'
     meta: ['React', 'Live App'],
     keywords: ['portfolio', 'external', 'react'],
   }
   ```
2. *(Optional)* Add a custom SVG emblem for `case 'ext-my-project':` in `src/shared/ui/ToolEmblem.tsx`.

---

### 4. How to Register a Private Vault-Gated Mini-App

Private mini-apps are hidden from the public catalog until the user unlocks the Vault with `ADMIN_PASSWORD` and are protected at the router level by `<VaultGuard>`.

#### Option A: Built-in Private Mini-App (Code-Registered)
1. Build your page component under `src/projects/<private-tool>/`.
2. Wrap its route with `<VaultGuard>` in `src/App.tsx`:
   ```tsx
   <Route
     path="/my-private-tool"
     element={
       <VaultGuard>
         <MyPrivateToolPage onOpenCommandPalette={openPalette} />
       </VaultGuard>
     }
   />
   ```
3. Add its descriptor to `builtinPrivateApps` in **both** `api/vault.ts` and `vite.config.ts`:
   ```ts
   {
     id: 'my-private-tool',
     title: 'My Private Tool',
     description: 'Confidential internal utility.',
     url: '/my-private-tool',
   }
   ```
4. **Privacy Rule:** Never list or mention private Vault-gated mini-apps in the root `README.md` or `src/data/projects.ts`.

#### Option B: Environment-Injected Private Apps (`PRIVATE_APPS_JSON`)
You can also inject private internal or external links without modifying code by setting the `PRIVATE_APPS_JSON` environment variable in Vercel:
```json
[
  {
    "id": "custom-private-app",
    "title": "Internal Dashboard",
    "description": "Private metrics and administration portal.",
    "url": "https://internal.example.com",
    "badge": "Vault"
  }
]
```

---

### 5. Safely Modifying Styling Tokens or Tool Behavior

- **Changing Colors, Fonts, or Spacing:** Edit `src/styles/tokens.css`. Always update both `:root` (Dark mode) and `[data-theme='light']` (Light mode) so contrast and surface elevation remain balanced in both themes.
- **Adding a New Accent Color:**
  1. Define `--accent-<name>`, `--accent-<name>-subtle`, and `--accent-<name>-border` in `:root` and `[data-theme='light']` inside `src/styles/tokens.css`.
  2. Add `[data-accent='<name>']` rules in `src/styles/tokens.css`.
  3. Add `'<name>'` to `ToolAccent` in `src/data/projects.ts`, `BadgeTone` in `src/shared/ui/Badge.tsx`, and `getAccentBadgeTone()` in `src/shared/ui/ToolEmblem.tsx`.

---

<div dir="rtl">

## الجزء الثاني — دليل التوسعة والتطوير باللغة العربية

### 1. كيفية إضافة أداة عامة جديدة (Public Mini-App)

لإضافة أداة داخلية جديدة تظهر في الصفحة الرئيسية ولوحة الأوامر السريعة:

1. **إنشاء مجلد الأداة (`src/projects/<tool-name>/`):**
   - أنشئ مكون الصفحة باستخدام `WorkspaceLayout` و`ToolBanner` و`Surface`، واستدعِ `recordRecentProject('<tool-id>')` داخل `useEffect` لتسجيل الأداة في شريط "المستخدمة مؤخراً".
2. **إضافة أيقونة مخصصة (اختياري):**
   - أضف حالة `case '<tool-id>':` داخل دالة `renderGlyph` في الملف `src/shared/ui/ToolEmblem.tsx`.
3. **تسجيل الأداة في الفهرس العام (`src/data/projects.ts`):**
   - أضف كائن الأداة إلى مصفوفة `INTERNAL_TOOLS` مع تحديد `id` و`title` و`description` و`category` و`to` و`accent`.
4. **ربط المسار في الموجه (`src/App.tsx`):**
   - أضف `<Route path="/<tool-route>" element={<YourToolPage onOpenCommandPalette={openPalette} />} />`.
5. **إضافة ملف الأنماط والتوثيق:**
   - إذا كانت الأداة تحتاج إلى تنسيقات خاصة، أنشئ ملف CSS في `src/styles/` وقم باستيراده في `src/main.tsx`، ثم أضف ملف `README.md` ثنائي اللغة داخل مجلد الأداة.

---

### 2. كيفية إضافة مزود جديد داخل أداة البريد المؤقت (Temp-Mail)

تعتمد أداة البريد المؤقت على نمط المحولات الموحد (`MailProviderAdapter`):

1. **تعريف معرّف المزود (`src/projects/temp-mail/types.ts`):** أضف اسم المزود إلى النوع `MailProviderId` وحدث دالة `normalizeProviderId`.
2. **إضافة مفاتيح التخزين (`src/projects/temp-mail/storage.ts`):** أضف مفتاح تخزين الحساب في `ACCOUNT_STORAGE_KEYS` (وفي `MESSAGE_CACHE_KEYS` إذا كان المزود يرسل محتوى الرسائل مباشرة مع القائمة).
3. **إنشاء وسيط الـ API (`api/<provider>.ts` و `vite.config.ts`):** أنشئ دالة Serverless في `api/` وسجل المسار المقابل في `vite.config.ts`.
4. **برمجة محول المزود (`src/projects/temp-mail/providers/<provider>.ts`):** نفّذ الواجهة `MailProviderAdapter` لتحميل النطاقات، إنشاء الحساب، جلب الرسائل، عرض التفاصيل، والحذف.
5. **تسجيل المزود (`src/projects/temp-mail/providers/index.ts`):** أضف المزود إلى `PROVIDER_ORDER` و`PROVIDERS_META` و`PROVIDER_ADAPTERS`.

---

### 3. كيفية إضافة بطاقة مشروع خارجي في الصفحة الرئيسية

افتح الملف `src/data/projects.ts` وأضف عنصراً جديداً داخل مصفوفة `EXTERNAL_PROJECTS` مع تحديد `type: 'external'` ورابط `href`، وسيظهر المشروع تلقائياً في الشبكة الرئيسية وفي البحث ولوحة الأوامر.

---

### 4. كيفية تسجيل أداة خاصة محمية بالخزنة (Vault-Gated Mini-App)

1. أنشئ صفحة الأداة داخل `src/projects/<private-tool>/`.
2. قم بحماية مسار الأداة في `src/App.tsx` عبر تغليفه بالمكون `<VaultGuard>`.
3. أضف بيانات الأداة إلى مصفوفة `builtinPrivateApps` في كلٍّ من `api/vault.ts` و`vite.config.ts` (أو عبر متغير البيئة `PRIVATE_APPS_JSON`).
4. **قاعدة الخصوصية الصارمة:** لا تذكر أي أداة خاصة في ملف `README.md` الرئيسي أو في `src/data/projects.ts`.

---

### 5. تعديل متغيرات التصميم (Design Tokens) بأمان

- لتعديل الألوان أو الخطوط أو المسافات، عدّل الملف `src/styles/tokens.css` مع الحرص على تحديث قيم الوضع الداكن (`:root`) والوضع الفاتح (`[data-theme='light']`) معاً للحفاظ على التباين البصري في كلا الوضعين.

</div>
