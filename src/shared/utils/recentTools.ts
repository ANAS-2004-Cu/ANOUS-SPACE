const RECENT_TOOLS_KEY = 'anous_recent_tools';
const MAX_RECENT = 3;

export function getRecentProjectIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function recordRecentProject(id: string): string[] {
  try {
    const current = getRecentProjectIds().filter((item) => item !== id);
    const updated = [id, ...current].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [id];
  }
}
