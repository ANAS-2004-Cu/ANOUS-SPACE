export type JsonDiagnostic =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export function isJsonLikeContent(content: string, selectedExt: string): boolean {
  if (selectedExt === '.json') return true;
  const trimmed = content.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

export function parseJsonWithDiagnostic(raw: string): JsonDiagnostic {
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, data: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = Number(posMatch[1]);
      const upToError = raw.slice(0, pos);
      const lines = upToError.split(/\r\n|\r|\n/);
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;
      return { ok: false, error: `${msg} (Line ${line}, Column ${col})` };
    }
    return { ok: false, error: msg };
  }
}
