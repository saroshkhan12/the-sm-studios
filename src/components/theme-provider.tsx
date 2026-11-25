"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "sm-studios-theme";

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const resolveTheme = () => {
      const resolved = readSavedTheme() ?? (media.matches ? "light" : "dark");
      applyTheme(resolved);
      setTheme(resolved);
    };

    resolveTheme();

    const handleSystemChange = () => {
      if (!readSavedTheme()) resolveTheme();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) resolveTheme();
    };

    media.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const current: Theme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next: Theme = current === "dark" ? "light" : "dark";
    const root = document.documentElement;

    const apply = () => {
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Theme remains usable for this page even when storage is unavailable.
      }
      setTheme(next);
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };

    if (
      !reducedMotion &&
      typeof transitionDocument.startViewTransition === "function"
    ) {
      const point = origin ?? { x: window.innerWidth - 32, y: 32 };
      root.style.setProperty("--theme-origin-x", `${point.x}px`);
      root.style.setProperty("--theme-origin-y", `${point.y}px`);
      try {
        transitionDocument.startViewTransition(apply);
      } catch {
        apply();
      }
    } else {
      apply();
    }
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
