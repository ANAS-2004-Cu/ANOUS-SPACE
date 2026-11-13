# Temp-Mail Suite

## Overview

A multi-provider disposable email client integrated into `ANOUS-SPACE`. It lets users provision temporary addresses, inspect incoming messages in real time, view sandboxed HTML or plain-text bodies, and download attachments across four independent email providers (`Mail.TM`, `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc`). Each provider is implemented behind a unified `MailProviderAdapter` interface with clean local/session persistence.

## Files

```text
src/projects/temp-mail/
├── types.ts                        # Unified provider, account, and message TypeScript interfaces
├── storage.ts                      # Canonical anous_tempmail_* storage helpers with legacy key fallback
├── providers/
│   ├── http.ts                     # Lightweight fetchJson / fetchBlob helpers with timeouts
│   ├── mailTm.ts                   # Mail.TM adapter (domains, auth, inbox, detail, delete, attachments)
│   ├── guerrillaMail.ts            # GuerrillaMail adapter (/api/guerrilla proxy, 11 domains, session cache)
│   ├── tempMailLol.ts              # TempMail.lol adapter (inbox create/poll + local history merge)
│   ├── maildrop.ts                 # Maildrop.cc GraphQL adapter (/api/maildrop proxy + direct fallback)
│   └── index.ts                    # Provider registry, metadata, and username generator
├── components/
│   ├── ProviderSelector.tsx        # Four-provider selection grid with active-inbox indicators
│   ├── ActiveAddressCard.tsx       # Active address banner with copy and open-inbox actions
│   ├── DomainSelectModal.tsx       # Modal picker for Mail.TM and GuerrillaMail domains
│   └── MessageRow.tsx              # Reusable inbox message row with muted avatar and actions
├── TempMailHubPage.tsx             # Provider selector, address provisioning, and active inbox entry
├── TempMailInboxPage.tsx           # Unified inbox view for Mail.TM, TempMail.lol, and Maildrop.cc
├── GuerrillaInboxPage.tsx          # Dedicated GuerrillaMail inbox view with session reset support
└── EmailDetailPage.tsx             # Sandboxed HTML/plain-text message viewer and attachment downloader
```

## Routes & Endpoints

### Client Routes

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/temp-mail` | `TempMailHubPage` | Select a disposable provider, pick a domain, and provision or open an address |
| `/temp-mail/inbox?provider=...` | `TempMailInboxPage` | List and manage messages for `Mail.TM`, `TempMail.lol`, or `Maildrop.cc` |
| `/temp-mail/guerrilla-inbox` | `GuerrillaInboxPage` | List messages and manage session state for `GuerrillaMail` |
| `/temp-mail/detail?id=...&provider=...` | `EmailDetailPage` | Render sandboxed HTML/text message content and download attachments |

### Upstream & Proxy Endpoints

| Provider | Endpoint / Proxy | Capabilities |
| :--- | :--- | :--- |
| `Mail.TM` | `https://api.mail.tm` | Domain list, account creation, JWT auth, inbox polling, message detail, delete, attachments |
| `GuerrillaMail` | `/api/guerrilla` → `https://api.guerrillamail.com/ajax.php` | Session init, custom alias/domain, inbox check, message detail, session forget |
| `TempMail.lol` | `https://api.tempmail.lol` (fallback `/api/tempmail-lol`) | Inbox creation with optional prefix, inbox polling, local message caching |
| `Maildrop.cc` | `/api/maildrop` → `https://api.maildrop.cc/graphql` | Passwordless GraphQL inbox query, message detail query, delete mutation |

## Storage Keys

| Key | Storage | Purpose |
| :--- | :--- | :--- |
| `anous_tempmail_mailtm` | `localStorage` | Stores active `Mail.TM` address, password, JWT token, and account ID |
| `anous_tempmail_guerrilla` | `localStorage` | Stores active `GuerrillaMail` address, `sid_token`, and `email_user` |
| `anous_tempmail_tempmail_lol` | `localStorage` | Stores active `TempMail.lol` address, token, and cached message history |
| `anous_tempmail_maildrop` | `localStorage` | Stores active `Maildrop.cc` address and mailbox name |
| `anous_tempmail_guerrilla_cache` | `sessionStorage` | Caches fetched `GuerrillaMail` message summaries across route transitions |
