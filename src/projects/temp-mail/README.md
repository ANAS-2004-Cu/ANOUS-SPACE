# Temp-Mail Client

[![Category](https://img.shields.io/badge/Category-Tools-3B82F6?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Ftemp--mail-171D33?style=flat-square)](#routes--endpoints)
[![Providers](https://img.shields.io/badge/Providers-4_Integrated_Engines-6366F1?style=flat-square)](#overview)

## Overview

Testing sign-up flows, OTP verification emails, or gated downloads shouldn't require exposing your personal address or relying on a single disposable mail service that might be rate-limited. Styled with a deep indigo-slate **Modern Inbox Client** atmosphere (`#0F1322` in Dark Mode / `#F2F4FB` in Light Mode), **Temp-Mail Client** unifies four independent disposable email providers under a single interface:

- **Mail.TM (`#6366F1` Indigo · `HYDRA REST`)**: Authenticated Hydra REST mailbox supporting custom domain selection and binary attachment downloads.
- **GuerrillaMail (`#10B981` Emerald · `MULTI-DOMAIN`)**: Session-token (`sid_token`) inbox with multi-domain alias switching and automatic session recovery.
- **TempMail.lol (`#F59E0B` Amber · `LOCAL CACHE`)**: Instant token-based inbox that merges and caches incoming messages in `localStorage` so they remain readable even after upstream read-eviction.
- **Maildrop.cc (`#06B6D4` Cyan · `GRAPHQL`)**: Passwordless GraphQL inbox allowing instant custom usernames on `@maildrop.cc`.

> [!NOTE]
> **Serverless CORS Proxy Architecture & Sandboxed Reader**: Because `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc` enforce strict browser CORS policies, requests are routed transparently through lightweight serverless proxy endpoints (`/api/guerrilla`, `/api/tempmail-lol`, `/api/maildrop`). Incoming HTML bodies render inside a strict `sandbox="allow-popups allow-popups-to-escape-sandbox"` `<iframe>` with a one-click Plain Text toggle.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `TempMailHubPage.tsx` | 4-provider switcher with brand accent pills, active inbox banner with live green pulse indicator, random alias generator, and address creation form. |
| `TempMailInboxPage.tsx` | Unified inbox list for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` featuring deterministic sender-initial avatar circles, manual refresh, and message deletion. |
| `GuerrillaInboxPage.tsx` | Session-aware inbox view for `GuerrillaMail` with `sid_token` health checks, attachment indicators, and one-click session reset. |
| `EmailDetailPage.tsx` | Message reader with sandboxed HTML `<iframe>` vs. Plain Text view switcher, clipboard copy, deletion, and authenticated `Mail.TM` attachment downloads. |
| `DomainSelectModal.tsx` | Accessible modal dialog for selecting available domains on `Mail.TM` and `GuerrillaMail`. |
| `tempMailService.ts` | Multi-provider API client managing REST/GraphQL requests, Bearer token hydration, domain probing, and local message caching. |
| `README.md` | Module documentation for the Temp-Mail Client suite. |

---

## Routes & Endpoints

| Route / Endpoint | Type | Responsibility |
| :--- | :--- | :--- |
| `/temp-mail` | Client Route | Provider selection, active address quick-bar, and new mailbox creation (`TempMailHubPage`). |
| `/temp-mail/inbox` | Client Route | Unified inbox list for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` (`TempMailInboxPage`). |
| `/temp-mail/guerrilla-inbox` | Client Route | Dedicated session inbox for `GuerrillaMail` (`GuerrillaInboxPage`). |
| `/temp-mail/detail` | Client Route | Full HTML/Plain-Text message viewer and attachment downloader (`EmailDetailPage`). |
| `/api/guerrilla` | Serverless Proxy | Forwards session and inbox requests to `https://api.guerrillamail.com/ajax.php`. |
| `/api/tempmail-lol` | Serverless Proxy | Forwards `/v2/inbox/create` and `/v2/inbox` polling requests to `https://api.tempmail.lol`. |
| `/api/maildrop` | Serverless Proxy | Forwards GraphQL inbox and message queries/mutations to `https://api.maildrop.cc/graphql`. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `mailtm_data` | `localStorage` | Persists `{ email, password, token, id }` for the active `Mail.TM` account (with fallback read compatibility for legacy `mailgw_data`). |
| `guerrilla_data` | `localStorage` | Persists `{ email_addr, sid_token, email_user }` for the active `GuerrillaMail` session. |
| `guerrilla_cached_emails` | `sessionStorage` | Caches fetched `GuerrillaMail` message headers across route transitions for instant back-navigation. |
| `tempmail_lol_data` | `localStorage` | Persists `{ address, token, emails }` for `TempMail.lol`, retaining messages locally after the upstream API clears them on read. |
| `maildrop_data` | `localStorage` | Persists `{ email, mailbox }` for the active passwordless `Maildrop.cc` address. |
| `anous_recent_tools` | `localStorage` | Records `'temp-mail'` via `recordRecentProject('temp-mail')` when the workspace opens. |
