import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadSettings,
  saveSettings,
  makeCategory,
} from "../services/settingsService";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [state, setState] = useState(loadSettings);

  useEffect(() => {
    saveSettings(state);
  }, [state]);

  const value = useMemo(
    () => ({
      categories: state.categories,
      preferences: state.preferences,

      getCategory: (id) => state.categories.find((c) => c.id === id) ?? null,

      addCategory: ({ name, color }) => {
        const category = makeCategory({ name, color });
        setState((s) => ({ ...s, categories: [...s.categories, category] }));
        return category;
      },

      updateCategory: (id, patch) => {
        setState((s) => ({
          ...s,
          categories: s.categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...patch,
                  name:
                    typeof patch.name === "string" ? patch.name.trim() : c.name,
                }
              : c,
          ),
        }));
      },

      deleteCategory: (id) => {
        setState((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
        }));
      },

      updatePreferences: (patch) => {
        setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
      },
    }),
    [state],
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
