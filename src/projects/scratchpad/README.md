# Quick Scratchpad & File Maker

## Overview

Quick Scratchpad & File Maker is a persistent browser-based text and code editor with live document metrics, file import, and smart JSON formatting and validation. It also includes an instant client-side file exporter that generates downloadable `Blob` files across preset or custom extensions.

## Files

- `ScratchpadPage.tsx`: Implements the auto-saving editor surface, drag-and-drop file importer, JSON formatter/minifier/validator toolbar, and multi-extension `Blob` file downloader.
- `README.md`: Module documentation for the Scratchpad workspace.

## Routes & Endpoints

- `/scratchpad`: Client route rendering `ScratchpadPage`.

## Storage Keys

- `anous_scratchpad_content` (`localStorage`): Persists the raw text or code buffer inside the editor.
- `anous_scratchpad_filename` (`localStorage`): Persists the target base filename for file exports.
- `anous_scratchpad_ext` (`localStorage`): Persists the active file extension preset (`.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, or `custom`).
- `anous_recent_tools` (`localStorage`): Records `'scratchpad'` via `recordRecentProject('scratchpad')` when the module mounts.
