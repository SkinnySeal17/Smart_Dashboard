// Date formatting helpers for rendering renewal dates. UI-only, no validation here.

export const DATE_STYLES = ["short", "medium", "long"];

// Module-level default date style. Kept in sync with the user's saved preference
// by SettingsContext (setDateStyle). Defaults to "medium" so callers that don't
// pass explicit options behave exactly as before until a preference is applied.
let currentDateStyle = "medium";

export function setDateStyle(style) {
  currentDateStyle = DATE_STYLES.includes(style) ? style : "medium";
}

export function formatDate(iso, opts) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso ?? "");
  return d.toLocaleDateString("en-US", opts ?? { dateStyle: currentDateStyle });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso ?? "");
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Whole days from today (local) to the given date. Negative = in the past. */
export function daysUntil(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target - today) / 86_400_000);
}

/** Human label for a renewal date, plus whether it's overdue/due today. */
export function renewalLabel(iso) {
  const days = daysUntil(iso);
  const base = formatDate(iso);
  if (days === null) return { text: base, overdue: false };
  if (days < 0) {
    const n = Math.abs(days);
    return { text: `${base} · ${n} day${n === 1 ? "" : "s"} overdue`, overdue: true };
  }
  if (days === 0) return { text: `${base} · due today`, overdue: true };
  return { text: `${base} · in ${days} day${days === 1 ? "" : "s"}`, overdue: false };
}
