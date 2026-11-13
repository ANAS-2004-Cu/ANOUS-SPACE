# Quick Scratchpad & File Maker

## Overview

When you need to inspect a raw API payload, pretty-print a tangled JSON response, or draft a quick `.env` or `.ts` file, spinning up a full desktop editor is unnecessary friction. **Quick Scratchpad & File Maker** drops you straight into a focused, GitHub-dark Code Studio (`#0D1117`) complete with a synchronized line-number gutter, live emerald/rose JSON syntax diagnostics, drag-and-drop file loading, and one-click `Blob` file export across any extension.

## Files

- `ScratchpadPage.tsx`: Implements the Code Studio IDE window (`#161B22`), top window toolbar with active filename tab, synchronized scroll line-number gutter, live line/word/byte status footer, smart JSON formatter/minifier/validator, and pill-based multi-extension file exporter.
- `README.md`: Module documentation for the Scratchpad workspace.

## Routes & Endpoints

- `/scratchpad`: Client route rendering `ScratchpadPage`.

## Storage Keys

- `anous_scratchpad_content` (`localStorage`): Auto-saves the raw text or code buffer on every keystroke so work survives tab closes and reloads.
- `anous_scratchpad_filename` (`localStorage`): Remembers the target base filename used when exporting a file.
- `anous_scratchpad_ext` (`localStorage`): Remembers the selected extension pill preset (`.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, or `custom`).
- `anous_recent_tools` (`localStorage`): Records `'scratchpad'` via `recordRecentProject('scratchpad')` when the workspace opens.
