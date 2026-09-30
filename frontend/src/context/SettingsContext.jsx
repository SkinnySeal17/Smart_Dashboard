import { loadCategories, createCategory, editCategory, removeCategory } from "../services/categoriesService";
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  loadSettings,
  saveSettings,
  defaultSettings,
} from "../services/settingsService";
import { setDateStyle } from "../utils/date";

const SettingsContext = createContext(null);

/** Reflect the chosen theme onto <html> so CSS can override prefers-color-scheme. */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme"); // "system" -> follow the OS setting
  }
}

export function SettingsProvider({ children }) {
  const [state, setState] = useState(() => ({ ...loadSettings(), categories: [] }));

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const reloadCategories = useCallback(async () => {
    setCategoriesLoading(true); setCategoriesError("");
    try { const categories = await loadCategories(); setState(s => ({ ...s, categories })); }
    catch (err) { setCategoriesError(err.message); }
    finally { setCategoriesLoading(false); }
  }, []);
  useEffect(() => { reloadCategories(); }, [reloadCategories]);
  useEffect(() => {
    saveSettings({ ...state, categories: [] });
  }, [state]);

  // Keep the app-wide side effects (theme, date formatting) in sync with prefs.
  useEffect(() => {
    applyTheme(state.appearance.theme);
  }, [state.appearance.theme]);

  useEffect(() => {
    setDateStyle(state.preferences.dateFormat);
  }, [state.preferences.dateFormat]);

  const value = useMemo(
    () => ({
      categoriesLoading, categoriesError, reloadCategories,
      profile: state.profile,
      categories: state.categories,
      notifications: state.notifications,
      appearance: state.appearance,
      preferences: state.preferences,

      getCategory: (id) => state.categories.find((c) => c.id === id) ?? null,

      updateProfile: (patch) => {
        setState((s) => ({
          ...s,
          profile: {
            ...s.profile,
            ...patch,
            ...(typeof patch.name === "string"
              ? { name: patch.name.trim() }
              : null),
            ...(typeof patch.email === "string"
              ? { email: patch.email.trim() }
              : null),
          },
        }));
      },

      updateNotifications: (patch) => {
        setState((s) => ({
          ...s,
          notifications: { ...s.notifications, ...patch },
        }));
      },

      setTheme: (theme) => {
        setState((s) => ({ ...s, appearance: { ...s.appearance, theme } }));
      },

      addCategory: async (data) => {
        const category = await createCategory(data);
        setState(s => ({ ...s, categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: async (id, patch) => {
        const current = state.categories.find(c => c.id === id);
        const category = await editCategory(id, { ...current, ...patch });
        setState(s => ({ ...s, categories: s.categories.map(c => c.id === id ? category : c) }));
      },
      deleteCategory: async (id) => {
        await removeCategory(id);
        setState(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }));
      },

      updatePreferences: (patch) => {
        setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
      },

      resetSettings: () => {
        setState(s => ({ ...defaultSettings(), categories: s.categories }));
      },
    }),
    [state, categoriesLoading, categoriesError, reloadCategories],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
