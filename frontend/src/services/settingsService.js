// Settings data access (localStorage-backed): profile, categories, notification
// preferences, appearance, and app preferences. No backend — everything here is
// saved to the current browser only.
import { readJSON, writeJSON, uid } from "./storage";

const KEY = "smart-dashboard.settings";

export const THEMES = ["light", "dark", "system"];
export const DATE_FORMATS = ["short", "medium", "long"];
export const DEFAULT_STATUSES = ["active", "inactive"];
export const RENEWAL_LEAD_DAYS = [1, 3, 7, 14];

export const DEFAULTS = {
  profile: {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
  },
  categories: [
    { id: "cat_web", name: "Web Development", color: "#aa3bff" },
    { id: "cat_design", name: "Design", color: "#3b82f6" },
    { id: "cat_consulting", name: "Consulting", color: "#16a34a" },
    { id: "cat_support", name: "Support", color: "#d97706" },
  ],
  notifications: {
    email: true,
    renewalReminders: true,
    renewalLeadDays: 7,
    overdueAlerts: true,
    weeklySummary: false,
  },
  appearance: {
    theme: "system",
  },
  preferences: {
    currency: "$",
    defaultStatus: "active",
    dateFormat: "medium",
  },
};

/** Deep-ish clone of the defaults so callers can never mutate the shared object. */
export function defaultSettings() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function normalizeProfile(stored) {
  const src = stored && typeof stored === "object" ? stored : {};
  return {
    name: typeof src.name === "string" ? src.name : DEFAULTS.profile.name,
    email: typeof src.email === "string" ? src.email : DEFAULTS.profile.email,
  };
}

function normalizeNotifications(stored) {
  const src = stored && typeof stored === "object" ? stored : {};
  const bool = (v, fallback) => (typeof v === "boolean" ? v : fallback);
  return {
    email: bool(src.email, DEFAULTS.notifications.email),
    renewalReminders: bool(
      src.renewalReminders,
      DEFAULTS.notifications.renewalReminders,
    ),
    renewalLeadDays: RENEWAL_LEAD_DAYS.includes(src.renewalLeadDays)
      ? src.renewalLeadDays
      : DEFAULTS.notifications.renewalLeadDays,
    overdueAlerts: bool(src.overdueAlerts, DEFAULTS.notifications.overdueAlerts),
    weeklySummary: bool(src.weeklySummary, DEFAULTS.notifications.weeklySummary),
  };
}

function normalizeAppearance(stored) {
  const theme = stored && THEMES.includes(stored.theme) ? stored.theme : "system";
  return { theme };
}

function normalizePreferences(stored) {
  const src = stored && typeof stored === "object" ? stored : {};
  return {
    currency:
      typeof src.currency === "string" && src.currency.trim()
        ? src.currency.slice(0, 3)
        : DEFAULTS.preferences.currency,
    defaultStatus: DEFAULT_STATUSES.includes(src.defaultStatus)
      ? src.defaultStatus
      : DEFAULTS.preferences.defaultStatus,
    dateFormat: DATE_FORMATS.includes(src.dateFormat)
      ? src.dateFormat
      : DEFAULTS.preferences.dateFormat,
  };
}

function normalizeCategories(stored) {
  if (!Array.isArray(stored)) return defaultSettings().categories;
  const clean = stored.filter(
    (c) => c && typeof c.id === "string" && typeof c.name === "string",
  );
  return clean.length ? clean : defaultSettings().categories;
}

/**
 * Load settings from storage, merging each section over the defaults and
 * discarding anything malformed so a corrupted value can't crash the app.
 */
export function loadSettings() {
  const stored = readJSON(KEY, null);
  if (!stored || typeof stored !== "object") return defaultSettings();
  return {
    profile: normalizeProfile(stored.profile),
    categories: normalizeCategories(stored.categories),
    notifications: normalizeNotifications(stored.notifications),
    appearance: normalizeAppearance(stored.appearance),
    preferences: normalizePreferences(stored.preferences),
  };
}

export function saveSettings(state) {
  writeJSON(KEY, state);
}

export function makeCategory({ name, color }) {
  return {
    id: uid("cat"),
    name: name.trim(),
    color: color || "#8b8b8b",
  };
}
