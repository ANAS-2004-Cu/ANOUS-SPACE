# Quick Scratchpad & File Maker

[![Category](https://img.shields.io/badge/Category-Tools-3B82F6?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Fscratchpad-161B22?style=flat-square)](#routes--endpoints)
[![Atmosphere](https://img.shields.io/badge/Atmosphere-Code_Studio_IDE-0D1117?style=flat-square)](#overview)

## Overview

**Quick Scratchpad & File Maker** is a persistent, browser-based **Code Studio IDE** (`#111317` graphite canvas in Dark Mode / `#F6F7F8` studio paper in Light Mode) built for inspecting raw API payloads, drafting configuration files, and exporting snippets without spinning up a local project.

The workspace renders an IDE editor window (`#181B21` dark / `#FFFFFF` light) with a recessed editor well (`#0F1115` dark / `#FAF9F6` light) featuring a top window bar with traffic-light indicators and an active filename tab (`resolvedFullFilename`), a scroll-synchronized line-number gutter (`handleScrollSync`), 2-space `Tab` indentation (`handleEditorKeyDown`), drag-and-drop or file-picker text import (`FileReader.readAsText`), a live bottom status bar (`Ln`, `Words`, `Chars`, byte size via `new Blob([content]).size`, `UTF-8`, `Spaces: 2`, `Auto-Saved`), and an instant client-side `Blob` file exporter.

> [!TIP]
> **Smart JSON Studio & Line/Column Error Diagnostics**:
> - **Auto-Detection (`looksLikeJson`)**: The `JSON STUDIO` toolbar activates automatically whenever `.json` is selected in the extension dock or when the trimmed buffer begins with `{` or `[`.
> - **Line & Column Pinpointing (`parseJsonWithDiagnostic`)**: When `JSON.parse` throws a `SyntaxError` containing a character offset (`position <N>`), the parser slices the buffer up to `pos`, splits by newline (`/\r\n|\r|\n/`), and reports the exact `(Line X, Column Y)` in a terracotta diagnostic pill (`#C26A58`), or confirms valid formatting (`2-space indent`) and minification in a sage pill (`#51A37D`).
> - **Preset & Custom Extensions (`PRESET_EXTENSIONS`)**: Supports one-click pills for `.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, plus `Custom...` (defaulting to `.yaml` and automatically prefixing `.` if omitted). When importing a file via drag-and-drop or `Import File`, the filename and extension pill synchronize automatically.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `ScratchpadPage.tsx` | Implements the Code Studio IDE window, scroll-synced line-number gutter, 2-space `Tab` handler, `FileReader` drag-and-drop importer, `parseJsonWithDiagnostic` formatter/minifier/validator, live byte/word/line status bar, and `URL.createObjectURL(new Blob(...))` file downloader. |
| `README.md` | Module documentation for the Quick Scratchpad & File Maker workspace. |

---

## Routes & Endpoints

| Route | Component | Responsibility |
| :--- | :--- | :--- |
| `/scratchpad` | `ScratchpadPage` | Renders the persistent Code Studio editor, JSON diagnostic bar, and instant multi-extension file exporter. |

---

## Storage Keys

| Key | Storage Engine | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `anous_scratchpad_content` | `localStorage` | `''` | Auto-saves the raw editor buffer on every `content` change. |
| `anous_scratchpad_filename` | `localStorage` | `'untitled'` | Persists the base filename used to construct `resolvedFullFilename`. |
| `anous_scratchpad_ext` | `localStorage` | `'.txt'` | Persists the selected extension pill (`.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, or `'custom'`). |
| `anous_recent_tools` | `localStorage` | `[]` | Records `'scratchpad'` on mount via `recordRecentProject('scratchpad')`. |
