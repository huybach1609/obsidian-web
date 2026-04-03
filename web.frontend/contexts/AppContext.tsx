"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import axios from "axios";

import { FileIndexDto } from "@/types/FileIndexDto";
import { VimConfig, defaultVimConfig } from "@/types/vimConfig";
import { useVimConfig } from "@/hook/useVimConfig";
import { clearVimConfigFromStorage } from "@/services/vimconfigservice";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookie";
import {
  THEME_COOKIE_KEY,
  EDIT_MODE_COOKIE_KEY,
  VIM_MODE_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
  LAST_VISITED_PATH_COOKIE_KEY,
  COOKIE_MAX_AGE_DAYS,
} from "@/lib/constants";

const THEME_MODES = ["obsidian", "obsidian-dark"] as const;

type ThemeMode = (typeof THEME_MODES)[number];

type AppContextValue = {
  theme: ThemeMode;
  accessToken: string | null;
  editMode: boolean;
  vimMode: boolean;
  vimConfig: VimConfig;
  fileIndex: FileIndexDto[];
  lastVisitedPath: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setAccessToken: (token: string | null) => void;
  setEditMode: (mode: boolean) => void;
  setVimMode: (mode: boolean) => void;
  setVimConfig: (config: VimConfig) => Promise<void>;
  setLastVisitedPath: (path: string | null) => void;
  clearAppSettings: () => void;
};

const defaultValue: AppContextValue = {
  theme: "obsidian-dark",
  accessToken: null,
  editMode: false,
  vimMode: false,
  vimConfig: defaultVimConfig,
  fileIndex: [],
  lastVisitedPath: null,
  setThemeMode: () => {},
  setAccessToken: () => {},
  clearAppSettings: () => {},
  setEditMode: () => {},
  setVimMode: () => {},
  setVimConfig: async () => {},
  setLastVisitedPath: () => {},
};

const AppContext = createContext<AppContextValue>(defaultValue);

function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value);
}

export function getTokenFromCookie() {
  return getCookie(TOKEN_COOKIE_KEY);
}

export function getLastVisitedPathFromCookie() {
  return getCookie(LAST_VISITED_PATH_COOKIE_KEY);
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("obsidian-dark");
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [fileIndex, setFileIndexState] = useState<FileIndexDto[]>([]);
  const [editMode, setEditModeState] = useState<boolean>(false);
  const [vimMode, setVimModeState] = useState<boolean>(false);
  const [lastVisitedPath, setLastVisitedPathState] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // Tailwind's `dark:` utilities require the `dark` class on <html>.
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "dark",
      themeMode === "obsidian-dark",
    );
  }, [themeMode]);

  // Use the useVimConfig hook for vim configuration management
  const { config: vimConfig, updateConfig: updateVimConfig } = useVimConfig();

  const initializedRef = useRef(false);
  const syncFromProviderRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const cookieTheme = getCookie(THEME_COOKIE_KEY);

    if (cookieTheme && isThemeMode(cookieTheme)) {
      setThemeModeState(cookieTheme);
      setTheme(cookieTheme);
    } else if (resolvedTheme && isThemeMode(resolvedTheme)) {
      setCookie(THEME_COOKIE_KEY, resolvedTheme, COOKIE_MAX_AGE_DAYS);
      setThemeModeState(resolvedTheme);
    }

    const cookieToken = getCookie(TOKEN_COOKIE_KEY);

    if (cookieToken) {
      setAccessTokenState(cookieToken);
    }

    const cookieEditMode = getCookie(EDIT_MODE_COOKIE_KEY);

    if (cookieEditMode != null) {
      setEditModeState(cookieEditMode === "true");
    }

    const cookieVimMode = getCookie(VIM_MODE_COOKIE_KEY);

    if (cookieVimMode != null) {
      setVimModeState(cookieVimMode === "true");
    }

    // Vim config is now managed by useVimConfig hook (stale-while-revalidate)

    const cookieLastVisitedPath = getCookie(LAST_VISITED_PATH_COOKIE_KEY);

    if (cookieLastVisitedPath) {
      setLastVisitedPathState(cookieLastVisitedPath);
    }
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    if (!resolvedTheme || !isThemeMode(resolvedTheme)) {
      return;
    }

    if (syncFromProviderRef.current) {
      syncFromProviderRef.current = false;

      return;
    }

    setThemeModeState((prev) => {
      if (prev === resolvedTheme) {
        return prev;
      }
      setCookie(THEME_COOKIE_KEY, resolvedTheme, COOKIE_MAX_AGE_DAYS);

      return resolvedTheme;
    });
  }, [resolvedTheme]);

  // auto load file index from backend cache
  useEffect(() => {
    const fetchFileIndex = async () => {
      const response = await axios.get("/file-index");

      // console.log('response', response.data);
      setFileIndexState(response.data);
    };

    if (getTokenFromCookie()) {
      fetchFileIndex();
    }
  }, [accessToken]);

  const updateThemeMode = useCallback(
    (mode: ThemeMode) => {
      syncFromProviderRef.current = true;
      setThemeModeState(mode);
      setCookie(THEME_COOKIE_KEY, mode, COOKIE_MAX_AGE_DAYS);
      setTheme(mode);
    },
    [setTheme],
  );

  const updateAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      setCookie(TOKEN_COOKIE_KEY, token, COOKIE_MAX_AGE_DAYS);
    } else {
      deleteCookie(TOKEN_COOKIE_KEY);
    }
  }, []);

  const clearAppSettings = useCallback(() => {
    syncFromProviderRef.current = true;
    setThemeModeState("obsidian-dark");
    deleteCookie(THEME_COOKIE_KEY);
    deleteCookie(TOKEN_COOKIE_KEY);
    setAccessTokenState(null);
    deleteCookie(EDIT_MODE_COOKIE_KEY);
    setEditModeState(false);
    deleteCookie(VIM_MODE_COOKIE_KEY);
    setVimModeState(false);
    clearVimConfigFromStorage();
    deleteCookie(LAST_VISITED_PATH_COOKIE_KEY);
    setLastVisitedPathState(null);
    setTheme("obsidian-dark");
  }, [setTheme]);

  const updateEditMode = useCallback((mode: boolean) => {
    setEditModeState(mode);
    setCookie(EDIT_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

  const updateVimMode = useCallback((mode: boolean) => {
    setVimModeState(mode);
    setCookie(VIM_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

  // updateVimConfig is provided by useVimConfig hook

  const updateLastVisitedPath = useCallback((path: string | null) => {
    setLastVisitedPathState(path);
    if (path) {
      setCookie(LAST_VISITED_PATH_COOKIE_KEY, path, COOKIE_MAX_AGE_DAYS);
    } else {
      deleteCookie(LAST_VISITED_PATH_COOKIE_KEY);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme: themeMode,
        accessToken,
        editMode,
        vimMode,
        vimConfig,
        fileIndex,
        lastVisitedPath,
        setThemeMode: updateThemeMode,
        setAccessToken: updateAccessToken,
        clearAppSettings,
        setEditMode: updateEditMode,
        setVimMode: updateVimMode,
        setVimConfig: updateVimConfig,
        setLastVisitedPath: updateLastVisitedPath,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppContext);
