# Temp-Mail Client · عميل البريد المؤقت

**Routes / المسارات:** `/temp-mail`, `/temp-mail/inbox`, `/temp-mail/detail`  
**Accent / الهوية اللونية:** `slate`

---

## English Documentation

### 1. Overview
**Temp-Mail Client** is a unified, 9-provider disposable email workspace supporting **REST**, **Query-string**, and **GraphQL** upstream services. It allows users to create or activate disposable addresses, switch seamlessly across providers while retaining active sessions, auto-poll inboxes every 10 seconds, inspect sanitized HTML or plain-text email bodies, and download attachments.

### 2. File Structure
```text
src/projects/temp-mail/
├── TempMailHubPage.tsx          # Hub view: provider selector, address composer, active address card
├── useTempMailHub.ts            # Hub controller hook: domain loading/caching, account creation, preview
├── TempMailInboxPage.tsx        # Inbox view + 10s auto-refresh polling & message deletion
├── EmailDetailPage.tsx          # Message viewer: sandboxed HTML iframe, plain-text toggle, attachments
├── types.ts                     # MailProviderId, MailProviderAdapter, TempAccount, EmailSummary, EmailDetail
├── storage.ts                   # Per-provider account & inline message cache storage helpers
├── components/
│   ├── ActiveAddressCard.tsx    # Card displaying active address, copy, scrambled toggle, inbox button
│   ├── DomainSelectModal.tsx    # Inline searchable dropdown for multi-domain providers
│   ├── InboxView.tsx            # Presentational inbox list, toolbar, empty/error states
│   └── ProviderSelector.tsx     # 9-provider interactive selection grid
└── providers/
    ├── index.ts                 # Provider registry (PROVIDER_ORDER, PROVIDERS_META, PROVIDER_ADAPTERS)
    ├── http.ts                  # Shared HTTP/JSON client, timeout handling, ProviderHttpError, blob download
    ├── grabmail.ts              # GrabMail.io adapter (/api/grabmail)
    ├── catchmail.ts             # Catchmail.io stateless adapter (/api/catchmail)
    ├── mailtm.ts                # Mail.tm & Mail.gw JWT REST factory (direct CORS)
    ├── tempmailIo.ts            # Temp-Mail.io v3 REST adapter (/api/tempmail-io)
    ├── inboxes.ts               # Inboxes.com v2 REST adapter (/api/inboxes)
    ├── tempmailLol.ts           # TempMail.lol v3 token adapter (/api/tempmail-lol)
    ├── tempmailPlus.ts          # TempMail.Plus stateless adapter (/api/tempmail-plus)
    ├── dropmail.ts              # DropMail.me GraphQL adapter (/api/dropmail)
    └── guerrilla.ts             # Guerrilla Mail session + scrambled alias adapter (/api/guerrilla)
```

### 3. Supported Providers & Capabilities Matrix

| Provider ID | Label | Protocol | Mode | Custom Username | Domains | Delete Message | Attachments | Proxy Route |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `grabmail.io` | **GrabMail** | REST | Stateless | Yes | Live API | No | Yes | `/api/grabmail` |
| `catchmail.io` | **Catchmail.io** | Query | Stateless | Yes (`user@domain` supported) | Fixed (`catchmail.io`) + Custom | Yes | No | `/api/catchmail` |
| `mail.tm` | **Mail.tm** | REST | Account (JWT) | Yes | Live API | Yes | No | Direct (`api.mail.tm`) |
| `mail.gw` | **Mail.gw** | REST | Account (JWT) | Yes | Live API | Yes | No | Direct (`api.mail.gw`) |
| `tempmail.io` | **Temp-Mail.io** | REST | Stateless | Yes | Live API | Yes | Yes | `/api/tempmail-io` |
| `inboxes.com` | **Inboxes.com** | REST | Stateless (Inline Cache) | Yes | Live API | No | No | `/api/inboxes` |
| `tempmail.lol` | **TempMail.lol** | REST | Account (Bearer Token) | No (Server-assigned) | Auto-assigned | No | No | `/api/tempmail-lol` |
| `tempmail.plus` | **TempMail.Plus** | Query | Stateless | Yes | 9 Fixed Domains (`fexpost.com`, `mailto.plus`, etc.) | Yes | Yes | `/api/tempmail-plus` |
| `dropmail.me` | **DropMail.me** | GraphQL | Session (`af_` token) | No (Server-assigned) | Live GraphQL Query | No | No | `/api/dropmail` |
| `guerrillamail` | **Guerrilla Mail** | Query | Session (`sid_token`) | Yes + Scrambled Alias | 10 Fixed Domains | Yes | No | `/api/guerrilla` |

### 4. State & Storage Persistence (`localStorage`)
- **Account Records (`ACCOUNT_STORAGE_KEYS` in `storage.ts`):**
  - Stored under `anous_tempmail_account_<provider-slug>` as serialized `TempAccount` JSON (`provider`, `address`, `token`, `accountId`, `sessionId`, `alias`, `useScrambled`).
- **Inline Message Cache (`MESSAGE_CACHE_KEYS` in `storage.ts`):**
  - Providers whose inbox endpoints return full message payloads inline (`inboxes.com`, `tempmail.lol`, `dropmail.me`) cache normalized `EmailDetail[]` under `anous_tempmail_messages_<provider-slug>` so `EmailDetailPage` can render messages offline/instantly.

### 5. Security & Rendering Details
- **Sandboxed HTML Email Viewer:** `EmailDetailPage.tsx` renders HTML emails inside an `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">` with `<base target="_blank" rel="noopener noreferrer" />`, preventing script execution (`allow-scripts` is intentionally omitted) while adapting background/text colors to the active theme.
- **Rate-Limit Resilience:** `TempMailInboxPage.tsx` catches `ProviderHttpError` with HTTP `429` during background polling without flipping the inbox into a fatal `sessionError` state.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
أداة **عميل البريد المؤقت (Temp-Mail Client)** هي منصة بريد مؤقت موحدة تدعم **9 مزودين مختلفين** عبر بروتوكولات REST وQuery وGraphQL. تتيح للمستخدم إنشاء عناوين بريد مؤقتة بأسماء مخصصة أو تلقائية، والتبديل بين المزودين مع الاحتفاظ بالجلسات الفعالة، وتحديث صندوق الوارد تلقائياً كل 10 ثوانٍ، وقراءة الرسائل بصيغة HTML معزولة أو نص عادي، وتحميل المرفقات.

### 2. هيكل الملفات
- `TempMailHubPage.tsx` و `useTempMailHub.ts`: صفحة المركز الرئيسي لاختيار المزود، تحديد النطاق، ومعاينة وإنشاء البريد.
- `TempMailInboxPage.tsx`: صفحة صندوق الوارد مع التحديث التلقائي كل 10 ثوانٍ وإدارة الجلسة.
- `EmailDetailPage.tsx`: صفحة عرض تفاصيل الرسالة (HTML معزول داخل `iframe` أو نص عادي) وتحميل المرفقات.
- `providers/`: محولات المزودين التسعة (`grabmail`, `catchmail`, `mailtm`, `tempmailIo`, `inboxes`, `tempmailLol`, `tempmailPlus`, `dropmail`, `guerrilla`).
- `storage.ts`: إدارة حفظ الحسابات النشطة والرسائل المخزنة محلياً في `localStorage`.

### 3. التخزين المحلي (`localStorage`)
- `anous_tempmail_account_<provider>`: يحفظ بيانات الحساب النشط (`TempAccount`) لكل مزود على حدة بحيث يمكنك استخدام عدة مزودين في نفس الوقت.
- `anous_tempmail_messages_<provider>`: يحفظ محتوى الرسائل محلياً للمزودين الذين يرسلون نص الرسالة الكامل أثناء جلب القائمة (`inboxes.com`, `tempmail.lol`, `dropmail.me`).

### 4. كيفية التخصيص
- **تعديل فترة التحديث التلقائي:** غيّر الثابت `DEFAULT_AUTO_REFRESH_MS = 10_000` في الملف `src/projects/temp-mail/TempMailInboxPage.tsx`.
- **إضافة مزود جديد:** اتبع الخطوات التفصيلية الموضحة في [`docs/EXTENDING.md`](../../../docs/EXTENDING.md).

</div>
