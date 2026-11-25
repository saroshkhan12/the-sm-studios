"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "sm-studios-theme";
const THEME_CHANGE_EVENT = "sm-studios-theme-change";

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// The server and the first hydration render intentionally agree. The inline
// pre-hydration script in layout.tsx sets the real theme before the page paints;
// useSyncExternalStore then reconciles the React controls with that value.
function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");

  const syncTheme = () => {
    const resolved = readSavedTheme() ?? getSystemTheme();
    applyTheme(resolved);
    onStoreChange();
  };

  const handleSystemChange = () => {
    if (!readSavedTheme()) syncTheme();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) syncTheme();
  };

  const handleLocalThemeChange = () => onStoreChange();

  media.addEventListener("change", handleSystemChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleLocalThemeChange);

  // Reconcile once after hydration in case storage or system preferences changed
  // between the early theme script and React mounting.
  syncTheme();

  return () => {
    media.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleLocalThemeChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";

    const apply = () => {
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // The theme remains usable for this page when storage is unavailable.
      }
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
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
      const root = document.documentElement;
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
