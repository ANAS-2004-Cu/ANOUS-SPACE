# Temp-Mail Client

## Overview

Temp-Mail Client is a multi-provider disposable email workspace supporting `Mail.TM`, `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc`. It provides custom and random address creation, domain selection, inbox management, sandboxed HTML and plain-text message viewing, and authenticated attachment downloads.

## Files

- `TempMailHubPage.tsx`: Provider switcher, active account card, random username generator, and new address creation form.
- `TempMailInboxPage.tsx`: Unified inbox list view for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` accounts.
- `GuerrillaInboxPage.tsx`: Session-managed inbox view for `GuerrillaMail` with session expiration recovery and reset controls.
- `EmailDetailPage.tsx`: Message reader providing sandboxed HTML `<iframe>` rendering, plain-text toggle, clipboard copy, message deletion, and `Mail.TM` attachment downloads.
- `DomainSelectModal.tsx`: Modal dialog for selecting available domains on `Mail.TM` and `GuerrillaMail`.
- `tempMailService.ts`: Multi-provider API client handling REST/GraphQL requests, Bearer token hydration, and local inbox caching.
- `README.md`: Module documentation for the Temp-Mail suite.

## Routes & Endpoints

- `/temp-mail`: Client route for provider selection and disposable account creation (`TempMailHubPage`).
- `/temp-mail/inbox`: Client route for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` inboxes (`TempMailInboxPage`).
- `/temp-mail/guerrilla-inbox`: Client route for the `GuerrillaMail` inbox (`GuerrillaInboxPage`).
- `/temp-mail/detail`: Client route for reading an individual message (`EmailDetailPage`).
- `/api/guerrilla`: Serverless CORS proxy forwarding requests to `https://api.guerrillamail.com/ajax.php`.
- `/api/maildrop`: Serverless CORS proxy forwarding GraphQL queries and mutations to `https://api.maildrop.cc/graphql`.
- `/api/tempmail-lol`: Serverless CORS proxy forwarding inbox creation and message polling requests to `https://api.tempmail.lol`.

## Storage Keys

- `mailtm_data` (`localStorage`): Stores `{ email, password, token, id }` for the active `Mail.TM` account (with fallback read support for legacy `mailgw_data`).
- `guerrilla_data` (`localStorage`): Stores `{ email_addr, sid_token, email_user }` for the active `GuerrillaMail` session.
- `guerrilla_cached_emails` (`sessionStorage`): Caches fetched `GuerrillaMail` message headers across route navigation.
- `tempmail_lol_data` (`localStorage`): Stores `{ address, token, emails }` for `TempMail.lol`, persisting fetched messages locally after the upstream server clears them on read.
- `maildrop_data` (`localStorage`): Stores `{ email, mailbox }` for the active passwordless `Maildrop.cc` inbox.
- `anous_recent_tools` (`localStorage`): Records `'temp-mail'` via `recordRecentProject('temp-mail')` when the module mounts.
