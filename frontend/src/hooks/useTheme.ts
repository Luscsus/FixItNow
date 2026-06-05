import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "fixitnow.theme";

/** The OS-level preference (macOS/iOS/Windows/Android dark mode). */
function systemTheme(): Theme {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}

/** An explicit user choice, if they've toggled before; null means "follow the OS". */
function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch { return null; }
}

/** Effective theme: an explicit choice if present, otherwise the OS preference. */
function resolveTheme(): Theme {
  return savedTheme() ?? systemTheme();
}

/** Apply to <html> only — persistence happens only on an explicit toggle. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Light/dark theme.
 *  • Defaults to the operating system's preference (set pre-paint by the inline
 *    script in index.html, so there's no flash).
 *  • Follows the OS live — if macOS/iOS switches to dark (e.g. at sunset) while
 *    the site is open, it switches too — UNLESS the user has made an explicit
 *    choice via the toggle, which then persists and wins.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  // Mirror state onto <html> (does NOT persist — keeps "follow OS" sticky).
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Live-follow the OS while the user hasn't picked a theme explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (savedTheme() === null) setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Sync explicit choices (and "reset to OS") across tabs.
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
