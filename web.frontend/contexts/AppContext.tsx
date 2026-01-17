'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import { FileIndexDto } from '@/types/FileIndexDto';
import axios from 'axios';
import { deleteCookie, getCookie, setCookie } from '@/utils/cookie';

type ThemeMode = 'light' | 'dark';

type AppContextValue = {
  theme: ThemeMode;
  accessToken: string | null;
  editMode: boolean;
  vimMode: boolean;
  fileIndex: FileIndexDto[];
  lastVisitedPath: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setAccessToken: (token: string | null) => void;
  setEditMode: (mode: boolean) => void;
  setVimMode: (mode: boolean) => void;
  setLastVisitedPath: (path: string | null) => void;
  clearAppSettings: () => void;


};

const THEME_COOKIE_KEY = 'app-theme';
const EDIT_MODE_COOKIE_KEY = 'app-edit-mode';
const VIM_MODE_COOKIE_KEY = 'app-vim-mode';
export const TOKEN_COOKIE_KEY = 'app-token';
const LAST_VISITED_PATH_COOKIE_KEY = 'app-last-visited-path';
const COOKIE_MAX_AGE_DAYS = 30;

const defaultValue: AppContextValue = {
  theme: 'light',
  accessToken: null,
  editMode: false,
  vimMode: false,
  fileIndex: [],
  lastVisitedPath: null,
  setThemeMode: () => {},
  setAccessToken: () => {},
  clearAppSettings: () => {},
  setEditMode: () => {},
  setVimMode: () => {},
  setLastVisitedPath: () => {},
};

const AppContext = createContext<AppContextValue>(defaultValue);

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function getTokenFromCookie() {
  return getCookie(TOKEN_COOKIE_KEY);
}

export function getLastVisitedPathFromCookie() {
  return getCookie(LAST_VISITED_PATH_COOKIE_KEY);
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [fileIndex, setFileIndexState] = useState<FileIndexDto[]>([]);
  const [editMode, setEditModeState] = useState<boolean>(false);
  const [vimMode, setVimModeState] = useState<boolean>(false);
  const [lastVisitedPath, setLastVisitedPathState] = useState<string | null>(null);

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
      setEditModeState(cookieEditMode === 'true');
    }

    const cookieVimMode = getCookie(VIM_MODE_COOKIE_KEY);
    if (cookieVimMode != null) {
      setVimModeState(cookieVimMode === 'true');
    }

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

    setThemeModeState(prev => {
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
      const response = await axios.get('/file-index');
      // console.log('response', response.data);
      setFileIndexState(response.data);
    }
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
    setThemeModeState('light');
    deleteCookie(THEME_COOKIE_KEY);
    deleteCookie(TOKEN_COOKIE_KEY);
    setAccessTokenState(null);
    deleteCookie(EDIT_MODE_COOKIE_KEY);
    setEditModeState(false);
    deleteCookie(VIM_MODE_COOKIE_KEY);
    setVimModeState(false);
    deleteCookie(LAST_VISITED_PATH_COOKIE_KEY);
    setLastVisitedPathState(null);
    setTheme('light');
  }, [setTheme]);

  const updateEditMode = useCallback((mode: boolean) => {
    setEditModeState(mode);
    setCookie(EDIT_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

  const updateVimMode = useCallback((mode: boolean) => {
    setVimModeState(mode);
    setCookie(VIM_MODE_COOKIE_KEY, String(mode), COOKIE_MAX_AGE_DAYS);
  }, []);

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
        fileIndex,
        lastVisitedPath,
        setThemeMode: updateThemeMode,
        setAccessToken: updateAccessToken,
        clearAppSettings,
        setEditMode: updateEditMode,
        setVimMode: updateVimMode,
        setLastVisitedPath: updateLastVisitedPath,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppContext);

