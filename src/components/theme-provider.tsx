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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    const resolved: Theme =
      current === "light" || current === "dark"
        ? current
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    setTheme(resolved);
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next: Theme = current === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = () => {
      root.dataset.theme = next;
      root.style.colorScheme = next;
      window.localStorage.setItem(STORAGE_KEY, next);
      setTheme(next);
    };

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
      transitionDocument.startViewTransition(apply);
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
