export function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  return getItem(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal errors
  }
}
