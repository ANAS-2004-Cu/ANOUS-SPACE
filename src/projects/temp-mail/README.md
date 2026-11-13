# Temp-Mail Suite (`src/projects/temp-mail`)

Multi-provider disposable email client mounted at `/temp-mail` with support for four providers: **Mail.TM**, **GuerrillaMail**, **TempMail.lol**, and **Maildrop.cc**.

---

## Files & Routes

| File | Route | Responsibility |
| :--- | :--- | :--- |
| `TempMailHubPage.tsx` | `/temp-mail` | Provider switcher, active address card (`Copy` and `Open Inbox`), username generator, domain selector trigger, and account creation flow. |
| `TempMailInboxPage.tsx` | `/temp-mail/inbox` | Unified inbox view for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` (`?provider=...`). |
| `GuerrillaInboxPage.tsx` | `/temp-mail/guerrilla-inbox` | Session-aware inbox view for `GuerrillaMail` with automatic session re-initialization and reset support. |
| `EmailDetailPage.tsx` | `/temp-mail/detail` | Full message viewer (`?id=...&provider=...`) with sandboxed HTML `<iframe>` vs. Plain Text toggle, clipboard copy, deletion, and attachment downloads. |
| `DomainSelectModal.tsx` | *(Modal)* | Accessible modal dialog for choosing available domains on `Mail.TM` and `GuerrillaMail`. |
| `tempMailService.ts` | *(Service)* | API client functions, data models, token hydration, and local message caching for all 4 providers. |

---

## Supported Providers & Architecture

| Provider | Upstream API | Proxy Endpoint | Auth Mechanism |
| :--- | :--- | :--- | :--- |
| **Mail.TM** | `https://api.mail.tm` | Direct CORS REST | Hydra REST (`/accounts`, `/token`, `/messages`) with `Bearer` JWT header auto-hydrated from `localStorage`. |
| **GuerrillaMail** | `https://api.guerrillamail.com/ajax.php` | `/api/guerrilla` | Session token (`sid_token`) passed as query parameter. |
| **TempMail.lol** | `https://api.tempmail.lol` | `/api/tempmail-lol` | Bearer-style `token` query parameter (`/v2/inbox/create`, `/v2/inbox?token=...`). |
| **Maildrop.cc** | `https://api.maildrop.cc/graphql` | `/api/maildrop` | Passwordless GraphQL queries (`inbox`, `message`) and `delete` mutation keyed by mailbox name. |

---

## Browser Storage Keys

| Storage Key | Scope | Provider | Stored Payload |
| :--- | :--- | :--- | :--- |
| `mailtm_data` | `localStorage` | Mail.TM | `{ email, password, token, id }` (with automatic fallback read from legacy `mailgw_data`). |
| `guerrilla_data` | `localStorage` | GuerrillaMail | `{ email_addr, sid_token, email_user }`. |
| `guerrilla_cached_emails` | `sessionStorage` | GuerrillaMail | Cached array of `GuerrillaEmailResponse` items preserved across route transitions. |
| `tempmail_lol_data` | `localStorage` | TempMail.lol | `{ address, token, emails: Email[] }`. Because TempMail.lol clears server messages once fetched, incoming messages are merged and persisted locally in `localStorage`. |
| `maildrop_data` | `localStorage` | Maildrop.cc | `{ email, mailbox }`. |

---

## Security & Rendering Notes

- **HTML Email Sandboxing**: `EmailDetailPage.tsx` renders HTML email bodies inside an `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">` using `srcDoc`. Scripts and same-origin parent access are blocked while allowing external links to open safely in a new tab.
- **Authenticated Attachments**: `downloadMailTmAttachment` in `tempMailService.ts` hydrates the `Mail.TM` Bearer token, fetches the attachment endpoint with `responseType: 'blob'`, and triggers a browser file download.
