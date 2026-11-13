# Temp-Mail Suite

## Overview

A multi-provider disposable email client integrated into `ANOUS-SPACE`. It lets users provision temporary addresses, inspect incoming messages, view sandboxed HTML or plain-text bodies, and download attachments across seven independent email providers (`Mail.TM`, `Mail.gw`, `GuerrillaMail`, `TempMail.lol`, `Maildrop.cc`, `Inboxes.com`, and `TempMail.Plus`). Each provider is implemented behind a unified `MailProviderAdapter` interface with local/session persistence and non-blocking toast feedback.

## Files

```text
src/projects/temp-mail/
├── types.ts                        # Unified provider, account, and message TypeScript interfaces
├── storage.ts                      # Canonical anous_tempmail_* storage helpers with legacy key fallback
├── providers/
│   ├── http.ts                     # Timeout-guarded JSON/blob HTTP helpers, HTML escaping, sender parser
│   ├── hydraMail.ts                # Shared Hydra OpenAPI adapter factory (domains, auth retry, mail, attachments)
│   ├── mailTm.ts                   # Mail.TM adapter configured against /api/mailtm
│   ├── mailGw.ts                   # Mail.gw adapter configured against /api/mailgw
│   ├── guerrillaMail.ts            # GuerrillaMail adapter (/api/guerrilla, 11 domains, session cache)
│   ├── tempMailLol.ts              # TempMail.lol adapter (locked polling + local history merge)
│   ├── maildrop.ts                 # Maildrop.cc GraphQL adapter (/api/maildrop proxy + direct fallback)
│   ├── inboxes.ts                  # Inboxes.com v2 adapter (/api/inboxes proxy, live domain selector)
│   ├── tempmailPlus.ts             # TempMail.Plus adapter (/api/tempmail-plus proxy, 8 domains, attachments)
│   └── index.ts                    # Provider registry, muted palette metadata, and username generator
├── components/
│   ├── ProviderSelector.tsx        # Multi-provider tab switcher with active-inbox dot indicators
│   ├── ActiveAddressCard.tsx       # Active address banner with copy and open-inbox actions
│   ├── DomainSelectModal.tsx       # Modal picker for providers supporting custom domain selection
│   └── MessageRow.tsx              # Reusable inbox message row with inline two-click delete confirm
├── TempMailHubPage.tsx             # Provider selector, address provisioning, and active inbox entry
├── TempMailInboxPage.tsx           # Unified inbox view for Hydra, TempMail.lol, Maildrop, Inboxes, and TempMail.Plus
├── GuerrillaInboxPage.tsx          # Dedicated GuerrillaMail inbox view with inline session reset confirmation
└── EmailDetailPage.tsx             # Sandboxed HTML/plain-text message viewer and attachment downloader
```

## Routes & Endpoints

### Client Routes

| Route | Component | Purpose |
| :--- | :--- | :--- |
| `/temp-mail` | `TempMailHubPage` | Select a disposable provider, pick a domain, and provision or open an address |
| `/temp-mail/inbox?provider=...` | `TempMailInboxPage` | List and manage messages for `Mail.TM`, `Mail.gw`, `TempMail.lol`, `Maildrop.cc`, `Inboxes.com`, or `TempMail.Plus` |
| `/temp-mail/guerrilla-inbox` | `GuerrillaInboxPage` | List messages and manage session state for `GuerrillaMail` |
| `/temp-mail/detail?id=...&provider=...` | `EmailDetailPage` | Render sandboxed HTML/text message content and download attachments |

### Upstream & Proxy Endpoints

| Provider | Endpoint / Proxy | Capabilities |
| :--- | :--- | :--- |
| `Mail.TM` | `/api/mailtm` → `https://api.mail.tm` | Domain list, account creation, JWT auth/refresh, inbox polling, message detail, delete, attachments |
| `Mail.gw` | `/api/mailgw` → `https://api.mail.gw` | Domain list, account creation, JWT auth/refresh, inbox polling, message detail, delete, attachments |
| `GuerrillaMail` | `/api/guerrilla` → `https://api.guerrillamail.com/ajax.php` | Session init, custom alias/domain, inbox list, message detail, upstream delete, session forget |
| `TempMail.lol` | `/api/tempmail-lol` → `https://api.tempmail.lol` | Inbox creation with optional prefix, deduplicated inbox polling, local history merge |
| `Maildrop.cc` | `/api/maildrop` → `https://api.maildrop.cc/graphql` | Passwordless GraphQL inbox query, message detail query, delete mutation |
| `Inboxes.com` | `/api/inboxes` → `https://inboxes.com/api/v2` | Live domain list, passwordless inbox listing, message detail, upstream delete |
| `TempMail.Plus` | `/api/tempmail-plus` → `https://tempmail.plus/api` | 8 disposable domains, mail listing, message detail, upstream delete, attachment downloads |

## Storage Keys

| Key | Storage | Purpose |
| :--- | :--- | :--- |
| `anous_tempmail_mailtm` | `localStorage` | Stores active `Mail.TM` address, password, JWT token, and account ID |
| `anous_tempmail_mailgw` | `localStorage` | Stores active `Mail.gw` address, password, JWT token, and account ID |
| `anous_tempmail_guerrilla` | `localStorage` | Stores active `GuerrillaMail` address, `sid_token`, and `email_user` |
| `anous_tempmail_tempmail_lol` | `localStorage` | Stores active `TempMail.lol` address, token, and cached message history |
| `anous_tempmail_maildrop` | `localStorage` | Stores active `Maildrop.cc` address and mailbox name |
| `anous_tempmail_inboxes` | `localStorage` | Stores active `Inboxes.com` address and chosen domain |
| `anous_tempmail_tempmail_plus` | `localStorage` | Stores active `TempMail.Plus` address and chosen domain |
| `anous_tempmail_guerrilla_cache` | `sessionStorage` | Caches fetched `GuerrillaMail` message summaries across route transitions |
