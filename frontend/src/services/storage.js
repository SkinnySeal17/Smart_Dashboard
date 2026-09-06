// Tiny localStorage helpers shared by the client-side services. No backend.

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota) — stay in-memory */
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function uid(prefix = "id") {
  const rand =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) ??
    Math.random().toString(36).slice(2, 12);
  return `${prefix}_${rand}`;
}
