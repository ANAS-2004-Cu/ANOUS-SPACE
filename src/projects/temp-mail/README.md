# Temp-Mail Client

## Overview

Testing sign-up flows, OTP verification emails, or gated downloads shouldn't require exposing your personal inbox or gambling on a single disposable mail service that might be rate-limited. Styled with a deep indigo-slate communication atmosphere (`#0F1322`), **Temp-Mail Client** unifies four independent disposable providers (`Mail.TM`, `GuerrillaMail`, `TempMail.lol`, and `Maildrop.cc`) under one roof—complete with provider brand pills, a live green pulse indicator on active addresses, colorful sender-initial avatars, and sandboxed HTML message rendering.

## Files

- `TempMailHubPage.tsx`: 4-provider switcher with distinct brand accent pills (`HYDRA REST`, `MULTI-DOMAIN`, `LOCAL CACHE`, `GRAPHQL`), active inbox banner with live pulse indicator, random alias generator, and address provisioning form.
- `TempMailInboxPage.tsx`: Unified inbox view for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` with deterministic sender-initial avatar circles, manual refresh, and message deletion.
- `GuerrillaInboxPage.tsx`: Session-aware inbox view for `GuerrillaMail` with automatic `sid_token` recovery, session reset controls, and colorful sender avatars.
- `EmailDetailPage.tsx`: Full message reader featuring a sandboxed HTML `<iframe>` vs. Plain Text toggle, one-click content copy, deletion, and authenticated `Mail.TM` attachment downloads.
- `DomainSelectModal.tsx`: Accessible modal dialog for switching domains on `Mail.TM` and `GuerrillaMail`.
- `tempMailService.ts`: Multi-provider client handling REST/GraphQL calls, automatic Bearer token hydration, and local inbox caching.
- `README.md`: Module documentation for the Temp-Mail suite.

## Routes & Endpoints

- `/temp-mail`: Client route for provider selection and disposable address creation (`TempMailHubPage`).
- `/temp-mail/inbox`: Client route for `Mail.TM`, `TempMail.lol`, and `Maildrop.cc` inboxes (`TempMailInboxPage`).
- `/temp-mail/guerrilla-inbox`: Client route for the `GuerrillaMail` inbox (`GuerrillaInboxPage`).
- `/temp-mail/detail`: Client route for reading an individual message (`EmailDetailPage`).
- `/api/guerrilla`: Serverless CORS proxy forwarding session and inbox requests to `https://api.guerrillamail.com/ajax.php`.
- `/api/maildrop`: Serverless CORS proxy forwarding GraphQL queries and mutations to `https://api.maildrop.cc/graphql`.
- `/api/tempmail-lol`: Serverless CORS proxy forwarding inbox creation and message polling requests to `https://api.tempmail.lol`.

## Storage Keys

- `mailtm_data` (`localStorage`): Stores `{ email, password, token, id }` for the active `Mail.TM` account (with fallback read support for legacy `mailgw_data`).
- `guerrilla_data` (`localStorage`): Stores `{ email_addr, sid_token, email_user }` for the active `GuerrillaMail` session.
- `guerrilla_cached_emails` (`sessionStorage`): Preserves fetched `GuerrillaMail` message headers across route transitions.
- `tempmail_lol_data` (`localStorage`): Stores `{ address, token, emails }` for `TempMail.lol`, merging and retaining messages locally after the upstream API clears them on read.
- `maildrop_data` (`localStorage`): Stores `{ email, mailbox }` for the active passwordless `Maildrop.cc` inbox.
- `anous_recent_tools` (`localStorage`): Records `'temp-mail'` via `recordRecentProject('temp-mail')` when the workspace opens.
