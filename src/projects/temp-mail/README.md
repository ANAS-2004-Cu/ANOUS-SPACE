# Temp-Mail Client

[![Category](https://img.shields.io/badge/Category-Tools-3B82F6?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Ftemp--mail-171D33?style=flat-square)](#routes--endpoints)
[![Providers](https://img.shields.io/badge/Providers-4_Disposable_Engines-6366F1?style=flat-square)](#overview)

## Overview

**Temp-Mail Client** is a multi-provider disposable email workspace styled with a deep indigo-slate **Modern Inbox Client** atmosphere (`#0F1322` canvas and `#171D33` cards in Dark Mode; `#F2F4FB` canvas and `#FFFFFF` cards in Light Mode). It integrates four distinct disposable email architectures (`TempMailProvider` enum in `tempMailService.ts`) so you always have a live inbox for OTP verifications, QA sign-up flows, and webhook testing:

- **Mail.TM (`mail.tm` · Indigo `#6366F1` · `HYDRA REST`)**: Connects to `https://api.mail.tm` (`GET /domains` with fallback `['dollicons.com', 'mail.tm']`, `POST /accounts`, `POST /token`). Hydrates Bearer tokens automatically via `hydrateMailTmToken()` and supports authenticated binary attachment downloads (`downloadMailTmAttachment` using `responseType: 'blob'`).
- **GuerrillaMail (`guerrillamail` · Emerald `#10B981` · `MULTI-DOMAIN`)**: Connects via `/api/guerrilla` to `https://api.guerrillamail.com/ajax.php`. Probes 11 domains (`GUERRILLA_DOMAINS`, including `guerrillamail.com`, `sharklasers.com`, `grr.la`, `pokemail.net`, and `spam4.me`), supports custom usernames (`set_email_user`) and domain switching (`set_email_domain`), and provides automatic `sid_token` recovery plus one-click `forget_me` session reset.
- **TempMail.lol (`tempmail.lol` · Amber `#F59E0B` · `LOCAL CACHE`)**: Connects to `https://api.tempmail.lol` (`/v2/inbox/create` with optional `{ prefix }` and `/v2/inbox?token=...`) with automatic fallback to `/api/tempmail-lol`. Because the upstream API clears messages once fetched, `fetchTempMailLolMessages()` deduplicates and merges incoming emails into `localStorage['tempmail_lol_data']` so messages remain accessible in `EmailDetailPage`.
- **Maildrop.cc (`maildrop.cc` · Cyan `#06B6D4` · `GRAPHQL`)**: Executes passwordless GraphQL queries (`GetInbox`, `GetMessage`) and mutations (`DeleteMessage`) against `/api/maildrop` (`https://api.maildrop.cc/graphql`) for any sanitized custom alias (`<username>@maildrop.cc`).

> [!NOTE]
> **Sandboxed HTML Reader & Deterministic Sender Avatars**:
> - In `TempMailInboxPage`, `GuerrillaInboxPage`, and `EmailDetailPage`, each sender's initial is mapped deterministically (`charCodeAt(0) % 6`) across a 6-color `AVATAR_PALETTE` (`#6366F1`, `#10B981`, `#F43F5E`, `#F59E0B`, `#0EA5E9`, `#8B5CF6`).
> - In `EmailDetailPage`, HTML messages are wrapped in a theme-aware document (`htmlWrapper`) and rendered inside an isolated `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" />`, with a toolbar button to toggle between **HTML** and **Plain Text** views.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `TempMailHubPage.tsx` | Renders the 4-provider switcher (`PROVIDER_META`), active account banner with `.live-pulse-dot` indicator, 10-character random username generator (`generateRandomString(10)`), domain picker triggers, and address provisioning actions. |
| `TempMailInboxPage.tsx` | Unified inbox list for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` (`?provider=...`), supporting manual refresh, message deletion, and navigation to `EmailDetailPage`. |
| `GuerrillaInboxPage.tsx` | Dedicated inbox view for `GuerrillaMail` with `sid_token` session initialization, `sessionStorage` header caching, attachment paperclip indicators (`item.att > 0`), and session reset handling. |
| `EmailDetailPage.tsx` | Full message reader supporting `Mail.TM`, `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc`, featuring the sandboxed HTML `<iframe>` / Plain Text toggle, content copy, deletion, and `Mail.TM` attachment downloads. |
| `DomainSelectModal.tsx` | Accessible modal dialog (`role="dialog"`, `aria-modal="true"`) for selecting domains on `Mail.TM` and `GuerrillaMail`. |
| `tempMailService.ts` | Unified service layer implementing REST/GraphQL calls, Bearer token hydration (`hydrateMailTmToken`), domain probing (`testGuerrillaDomains`), and local message merging. |
| `README.md` | Module documentation for the Temp-Mail Client suite. |

---

## Routes & Endpoints

| Route / Endpoint | Source File | Responsibility |
| :--- | :--- | :--- |
| `/temp-mail` | `TempMailHubPage.tsx` | Provider selection, active inbox quick-launch, and new disposable address creation. |
| `/temp-mail/inbox` | `TempMailInboxPage.tsx` | Inbox message list for `mail.tm`, `tempmail.lol`, and `maildrop.cc` (via `?provider=` query param). |
| `/temp-mail/guerrilla-inbox` | `GuerrillaInboxPage.tsx` | Session-managed inbox list for `GuerrillaMail`. |
| `/temp-mail/detail` | `EmailDetailPage.tsx` | Message detail reader (accepts `?id=<messageId>&provider=<provider>`). |
| `/api/guerrilla` | `api/guerrilla.ts` | Serverless CORS proxy forwarding query strings (`f=get_email_address`, `f=check_email`, `f=fetch_email`, etc.) to `https://api.guerrillamail.com/ajax.php`. |
| `/api/tempmail-lol` | `api/tempmail-lol.ts` | Serverless CORS proxy forwarding `endpoint` (`/v2/inbox/create` or `/v2/inbox`) and `token` parameters to `https://api.tempmail.lol`. |
| `/api/maildrop` | `api/maildrop.ts` | Serverless CORS proxy forwarding `POST` GraphQL payloads (`{ query, variables }`) to `https://api.maildrop.cc/graphql`. |

---

## Storage Keys

| Key | Storage Engine | Stored Schema | Purpose |
| :--- | :--- | :--- | :--- |
| `mailtm_data` | `localStorage` | `{ email, password, token, id }` | Active `Mail.TM` credentials and JWT Bearer token (with fallback read from legacy `mailgw_data`). |
| `guerrilla_data` | `localStorage` | `{ email_addr, sid_token, email_user }` | Active `GuerrillaMail` address and session token. |
| `guerrilla_cached_emails` | `sessionStorage` | `GuerrillaEmailResponse[]` | Caches fetched `GuerrillaMail` message headers across route navigation. |
| `tempmail_lol_data` | `localStorage` | `{ address, token, emails: Email[] }` | Active `TempMail.lol` token and locally retained message archive. |
| `maildrop_data` | `localStorage` | `{ email, mailbox }` | Active passwordless `Maildrop.cc` mailbox identifier. |
| `anous_recent_tools` | `localStorage` | `string[]` | Records `'temp-mail'` on mount via `recordRecentProject('temp-mail')`. |
