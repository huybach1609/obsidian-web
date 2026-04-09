"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";

import { deleteCookie, getCookie, setCookie } from "@/utils/cookie";
import {
  COOKIE_MAX_AGE_DAYS,
  EDIT_MODE_COOKIE_KEY,
  LAST_VISITED_PATH_COOKIE_KEY,
  THEME_COOKIE_KEY,
  VIM_MODE_COOKIE_KEY,
} from "@/lib/constants";

const THEME_MODES = ["obsidian", "obsidian-dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

type UiPrefsContextValue = {
  theme: ThemeMode;
  editMode: boolean;
  vimMode: boolean;
  lastVisitedPath: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setEditMode: (mode: boolean) => void;
  setVimMode: (mode: boolean) => void;
  setLastVisitedPath: (path: string | null) => void;
  clearUiPrefsSettings: () => void;
};

const defaultValue: UiPrefsContextValue = {
  theme: "obsidian-dark",
  editMode: false,
  vimMode: false,
  lastVisitedPath: null,
  setThemeMode: () => {},
  setEditMode: () => {},
  setVimMode: () => {},
  setLastVisitedPath: () => {},
  clearUiPrefsSettings: () => {},
};

const UiPrefsContext = createContext<UiPrefsContextValue>(defaultValue);

function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value);
}

export function getLastVisitedPathFromCookie() {
  return getCookie(LAST_VISITED_PATH_COOKIE_KEY);
}

export const UiPrefsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("obsidian-dark");
  const [editMode, setEditModeState] = useState(false);
  const [vimMode, setVimModeState] = useState(false);
  const [lastVisitedPath, setLastVisitedPathState] = useState<string | null>(
    null,
  );
  const initializedRef = useRef(false);
  const syncFromProviderRef = useRef(false);

  useEffect(() => {
    // Tailwind dark utility requires html.dark
    if (typeof document === "undefined") return;

    document.documentElement.classList.toggle(
      "dark",
      themeMode === "obsidian-dark",
    );
  }, [themeMode]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const cookieTheme = getCookie(THEME_COOKIE_KEY);

    if (cookieTheme && isThemeMode(cookieTheme)) {
      setThemeModeState(cookieTheme);
      setTheme(cookieTheme);
    } else if (resolvedTheme && isThemeMode(resolvedTheme)) {
      setCookie(THEME_COOKIE_KEY, resolvedTheme, COOKIE_MAX_AGE_DAYS);
      setThemeModeState(resolvedTheme);
    }

    const cookieEditMode = getCookie(EDIT_MODE_COOKIE_KEY);

    if (cookieEditMode != null) {
      setEditModeState(cookieEditMode === "true");
    }

    const cookieVimMode = getCookie(VIM_MODE_COOKIE_KEY);

    if (cookieVimMode != null) {
      setVimModeState(cookieVimMode === "true");
    }

    const cookieLastVisitedPath = getCookie(LAST_VISITED_PATH_COOKIE_KEY);

    if (cookieLastVisitedPath) {
      setLastVisitedPathState(cookieLastVisitedPath);
    }
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    if (!resolvedTheme || !isThemeMode(resolvedTheme)) return;

    if (syncFromProviderRef.current) {
      syncFromProviderRef.current = false;

      return;
    }

    setThemeModeState((prev) => {
      if (prev === resolvedTheme) return prev;

      setCookie(THEME_COOKIE_KEY, resolvedTheme, COOKIE_MAX_AGE_DAYS);

      return resolvedTheme;
    });
  }, [resolvedTheme]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      syncFromProviderRef.current = true;

      setThemeModeState(mode);
      setCookie(THEME_COOKIE_KEY, mode, COOKIE_MAX_AGE_DAYS);
      setTheme(mode);
    },
    [setTheme],
  );

  const setEditMode = useCallback((mode: boolean) => {
    setEditModeState(mode);
    setCookie(EDIT_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

  const setVimMode = useCallback((mode: boolean) => {
    setVimModeState(mode);
    setCookie(VIM_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

  const setLastVisitedPath = useCallback((path: string | null) => {
    setLastVisitedPathState(path);

    if (path) {
      setCookie(LAST_VISITED_PATH_COOKIE_KEY, path, COOKIE_MAX_AGE_DAYS);
    } else {
      deleteCookie(LAST_VISITED_PATH_COOKIE_KEY);
    }
  }, []);

  const clearUiPrefsSettings = useCallback(() => {
    syncFromProviderRef.current = true;
    setThemeModeState("obsidian-dark");
    deleteCookie(THEME_COOKIE_KEY);

    setTheme("obsidian-dark");

    deleteCookie(EDIT_MODE_COOKIE_KEY);
    setEditModeState(false);

    deleteCookie(VIM_MODE_COOKIE_KEY);
    setVimModeState(false);

    deleteCookie(LAST_VISITED_PATH_COOKIE_KEY);
    setLastVisitedPathState(null);
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme: themeMode,
      editMode,
      vimMode,
      lastVisitedPath,
      setThemeMode,
      setEditMode,
      setVimMode,
      setLastVisitedPath,
      clearUiPrefsSettings,
    }),
    [
      clearUiPrefsSettings,
      editMode,
      lastVisitedPath,
      setEditMode,
      setLastVisitedPath,
      setThemeMode,
      setVimMode,
      themeMode,
      vimMode,
    ],
  );

  return (
    <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>
  );
};

export const useUiPrefs = () => useContext(UiPrefsContext);
