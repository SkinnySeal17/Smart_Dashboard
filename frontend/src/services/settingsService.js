// Settings data access (localStorage-backed): categories + app preferences.
import { readJSON, writeJSON, uid } from "./storage";

const KEY = "smart-dashboard.settings";

export const DEFAULTS = {
  categories: [
    { id: "cat_web", name: "Web Development", color: "#aa3bff" },
    { id: "cat_design", name: "Design", color: "#3b82f6" },
    { id: "cat_consulting", name: "Consulting", color: "#16a34a" },
    { id: "cat_support", name: "Support", color: "#d97706" },
  ],
  preferences: {
    currency: "$",
    defaultStatus: "active",
  },
};

export function loadSettings() {
  const stored = readJSON(KEY, null);
  if (!stored) return DEFAULTS;
  return {
    categories: Array.isArray(stored.categories)
      ? stored.categories
      : DEFAULTS.categories,
    preferences: { ...DEFAULTS.preferences, ...(stored.preferences ?? {}) },
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
