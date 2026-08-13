// src/lib/themes/theme-provider.tsx
"use client";

import * as React from "react";
import { THEMES, getThemeById, DEFAULT_THEME_ID, type ThemeDefinition } from "./theme-definitions";

interface ThemeContextValue {
  themeId: string;
  theme: ThemeDefinition;
  setThemeId: (id: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "kodeo-theme";

function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.style.colorScheme = theme.mode;
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.mode;
}

export function ThemeProvider({
  children,
  initialThemeId,
}: {
  children: React.ReactNode;
  initialThemeId?: string | null;
}) {
  const [themeId, setThemeIdState] = React.useState(initialThemeId || DEFAULT_THEME_ID);

  // On mount, prefer localStorage (fast, no network) over the server-provided
  // default, then apply. This runs client-side only to avoid SSR/CSR mismatch
  // flicker beyond the very first paint.
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved = stored || initialThemeId || DEFAULT_THEME_ID;
    setThemeIdState(resolved);
    applyTheme(getThemeById(resolved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setThemeId = React.useCallback((id: string) => {
    setThemeIdState(id);
    applyTheme(getThemeById(id));
    localStorage.setItem(STORAGE_KEY, id);

    // Best-effort sync to server so it persists across devices. Fire and
    // forget — theme is a cosmetic preference, not worth blocking UI on.
    fetch("/api/settings/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: id }),
    }).catch(() => {
      /* non-critical */
    });
  }, []);

  const theme = getThemeById(themeId);

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export { THEMES };