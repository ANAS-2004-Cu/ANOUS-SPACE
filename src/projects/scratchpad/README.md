# Quick Scratchpad & File Maker (`src/projects/scratchpad`)

Self-contained developer scratchpad, JSON formatter/validator, and client-side file generator mounted at `/scratchpad`.

---

## Files

| File | Description |
| :--- | :--- |
| `ScratchpadPage.tsx` | Main workspace component implementing the persistent editor, file importer, JSON diagnostic toolbar, and multi-extension `Blob` downloader. |
| `README.md` | Module documentation. |

---

## Storage Keys (`localStorage`)

All editor state persists automatically across browser reloads using the following keys:

| Key | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `anous_scratchpad_content` | `string` | `""` | Raw text or code content inside the editor. |
| `anous_scratchpad_filename` | `string` | `"untitled"` | Base filename (without extension) used when exporting a file. |
| `anous_scratchpad_ext` | `string` | `".txt"` | Selected file extension preset or `"custom"`. |

Opening `/scratchpad` also records `'scratchpad'` in `anous_recent_tools` via `recordRecentProject('scratchpad')`.

---

## Key Capabilities

### 1. Persistent Code & Text Editor
- Automatically saves keystrokes to `localStorage`.
- Supports `Tab` indentation (inserts 2 spaces without losing focus).
- Computes live document telemetry in monospace: line count, word count, character count, and UTF-8 byte size (`new Blob([content]).size`).
- Provides one-click **Copy** (`clipboard.ts`), **Clear** (with confirmation dialog via `useAlert`), and **Import File** (via file picker or drag-and-drop onto the editor surface).

### 2. Smart JSON Helper
- Automatically activates when the selected extension is `.json` or when the trimmed content begins with `{` or `[`.
- **Format JSON**: Parses and pretty-prints JSON with 2-space indentation (`JSON.stringify(parsed, null, 2)`).
- **Minify**: Compacts JSON by removing whitespace (`JSON.stringify(parsed)`).
- **Validate**: Parses the current buffer and reports either confirmation (`Valid JSON`) or the exact syntax error message with line and column coordinates calculated from the character offset.

### 3. Instant File Exporter (`Blob`)
- Supports preset extensions: `.json`, `.env`, `.txt`, `.md`, `.js`, `.ts`, `.html`, `.css`, plus a custom extension input (e.g., `.yaml`, `.sql`, `.toml`).
- Constructs a `Blob` with `text/plain;charset=utf-8`, generates an ephemeral object URL via `URL.createObjectURL`, triggers an immediate browser download for `<filename><extension>`, and revokes the object URL.
