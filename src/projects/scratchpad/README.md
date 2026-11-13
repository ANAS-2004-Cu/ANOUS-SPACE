# Quick Scratchpad & File Maker

## Overview

When you need to inspect a raw API payload, draft a quick `.env` file, or turn a snippet of text into a downloadable file, spinning up a full IDE project is unnecessary friction. Quick Scratchpad & File Maker gives you an instant, auto-saving browser buffer with built-in JSON diagnostics and one-click `Blob` file export across any extension.

## Files

- `ScratchpadPage.tsx`: Implements the persistent editor buffer, drag-and-drop file import, live line/word/byte telemetry, smart JSON formatter/minifier/validator, and instant multi-extension file downloader.
- `README.md`: Module documentation for the Scratchpad workspace.

## Routes & Endpoints

- `/scratchpad`: Client route rendering `ScratchpadPage`.

## Storage Keys

- `anous_scratchpad_content` (`localStorage`): Auto-saves the raw text or code buffer on every keystroke so work survives tab closes and reloads.
- `anous_scratchpad_filename` (`localStorage`): Remembers the target base filename used when exporting a file.
- `anous_scratchpad_ext` (`localStorage`): Remembers the selected extension preset (`.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, or `custom`).
- `anous_recent_tools` (`localStorage`): Records `'scratchpad'` via `recordRecentProject('scratchpad')` when the workspace opens.
