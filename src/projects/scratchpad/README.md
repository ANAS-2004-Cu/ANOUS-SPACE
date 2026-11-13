# Quick Scratchpad & File Maker

[![Category](https://img.shields.io/badge/Category-Tools-3B82F6?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Fscratchpad-161B22?style=flat-square)](#routes--endpoints)
[![Atmosphere](https://img.shields.io/badge/Atmosphere-Code_Studio_IDE-0D1117?style=flat-square)](#overview)

## Overview

Spinning up a full desktop IDE just to inspect a raw webhook payload, format a minified JSON response, or save a quick `.env` file is unnecessary friction. **Quick Scratchpad & File Maker** provides an instant, auto-saving browser code studio styled in GitHub-dark obsidian (`#0D1117` in Dark Mode / `#F6F8FA` in Light Mode).

It pairs a synchronized line-number gutter and monospace editor window (`#161B22`) with real-time JSON syntax diagnostics, drag-and-drop local file loading, live character/word/byte telemetry, and instant client-side `Blob` file export across nine preset or custom file extensions.

> [!TIP]
> **Smart JSON Mode & Instant Export**: Whenever `.json` is selected in the extension pill bar—or when the buffer begins with `{` or `[`—the top IDE toolbar automatically activates live syntax validation (`JSON VALID` in emerald `#10B981` vs. `JSON INVALID` in rose `#F43F5E`) alongside one-click **Format** (`2-space pretty print`) and **Minify** actions.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `ScratchpadPage.tsx` | Renders the Code Studio IDE container, top window toolbar with active filename tab, synchronized scroll line-number gutter, drag-and-drop `FileReader` importer, JSON formatter/minifier, IDE status footer, and pill-based multi-extension `Blob` downloader. |
| `README.md` | Module documentation for the Quick Scratchpad & File Maker workspace. |

---

## Routes & Endpoints

| Route | Component | Responsibility |
| :--- | :--- | :--- |
| `/scratchpad` | `ScratchpadPage` | Main interactive editor, JSON diagnostic workspace, and client-side file exporter. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_scratchpad_content` | `localStorage` | Auto-saves the raw text or code buffer on every keystroke so work persists across reloads and browser restarts. |
| `anous_scratchpad_filename` | `localStorage` | Persists the base filename (e.g., `snippet`) used when exporting a downloadable file. |
| `anous_scratchpad_ext` | `localStorage` | Persists the active extension pill selection (`.txt`, `.json`, `.env`, `.md`, `.js`, `.ts`, `.html`, `.css`, or `custom`). |
| `anous_recent_tools` | `localStorage` | Records `'scratchpad'` via `recordRecentProject('scratchpad')` so the tool surfaces in the Hub Home Recent bar. |
