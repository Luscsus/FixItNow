import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "fixitnow.theme";
const DEFAULT_THEME: Theme = "light";

/** A saved choice if present, otherwise the default. The OS preference is ignored. */
function resolveTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}

/** Apply to <html>; persistence happens only on an explicit toggle. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Light/dark theme — switched ONLY by the toggle button. Defaults to light and
 * remembers the user's last manual choice; it does not follow the OS preference.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  // Mirror state onto <html>.
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Keep tabs in sync when the choice changes elsewhere.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setTheme(resolveTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === "dark" };
}
