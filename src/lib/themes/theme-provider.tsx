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

/**
 * Renders a blocking inline <script> in <head> that applies the saved
 * theme (localStorage, falling back to the server-provided default)
 * BEFORE the page paints. Without this, the page briefly flashes the
 * hardcoded globals.css colors and then jumps to the real theme once
 * React hydrates and ThemeProvider's effect runs — visible as a flash
 * on every full page load/refresh, and especially jarring now that
 * theming covers the public landing page too, not just the logged-in
 * app. This must be a plain script tag (not a React effect) because
 * effects only run after the initial paint.
 */
export function ThemeScript({ initialThemeId }: { initialThemeId?: string | null }) {
  // Serialized carefully: theme ids are always our own known slugs
  // (validated against THEMES server-side before being persisted), so
  // there's no untrusted-input/XSS concern in inlining this value.
  const fallback = initialThemeId || DEFAULT_THEME_ID;

  const script = `
(function() {
  try {
    var THEMES = ${JSON.stringify(
      Object.fromEntries(THEMES.map((t) => [t.id, { vars: t.vars, mode: t.mode }]))
    )};
    var id = localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || ${JSON.stringify(fallback)};
    var theme = THEMES[id] || THEMES[${JSON.stringify(DEFAULT_THEME_ID)}];
    var root = document.documentElement;
    for (var key in theme.vars) {
      root.style.setProperty(key, theme.vars[key]);
    }
    root.style.colorScheme = theme.mode;
    root.dataset.theme = id;
    root.dataset.themeMode = theme.mode;
  } catch (e) {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({
  children,
  initialThemeId,
}: {
  children: React.ReactNode;
  initialThemeId?: string | null;
}) {
  const [themeId, setThemeIdState] = React.useState(initialThemeId || DEFAULT_THEME_ID);

  // The ThemeScript above already applied the correct theme (from
  // localStorage or the server default) before this component ever
  // mounts. This effect just syncs React state to match whatever the
  // script actually applied, so useTheme() callers get the right
  // value without needing a second (flashing) re-apply.
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved = stored || initialThemeId || DEFAULT_THEME_ID;
    setThemeIdState(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setThemeId = React.useCallback((id: string) => {
    setThemeIdState(id);
    applyTheme(getThemeById(id));
    localStorage.setItem(STORAGE_KEY, id);

    // Best-effort sync to server so it persists across devices for
    // logged-in users. Fire and forget — theme is a cosmetic
    // preference, not worth blocking UI on, and for logged-out
    // visitors this 401s harmlessly (localStorage is already updated).
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