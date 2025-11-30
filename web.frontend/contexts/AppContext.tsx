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

type ThemeMode = 'light' | 'dark';

type AppContextValue = {
  theme: ThemeMode;
  accessToken: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setAccessToken: (token: string | null) => void;
  clearAppSettings: () => void;
};

const THEME_COOKIE_KEY = 'app-theme';
export const TOKEN_COOKIE_KEY = 'app-token';
const COOKIE_MAX_AGE_DAYS = 30;

const defaultValue: AppContextValue = {
  theme: 'light',
  accessToken: null,
  setThemeMode: () => {},
  setAccessToken: () => {},
  clearAppSettings: () => {},
};

const AppContext = createContext<AppContextValue>(defaultValue);

function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function setCookie(name: string, value: string, days = COOKIE_MAX_AGE_DAYS) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split('=')[1]) : null;
}

export function getTokenFromCookie() {
  return getCookie(TOKEN_COOKIE_KEY);
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
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
      setCookie(THEME_COOKIE_KEY, resolvedTheme);
      setThemeModeState(resolvedTheme);
    }

    const cookieToken = getCookie(TOKEN_COOKIE_KEY);
    if (cookieToken) {
      setAccessTokenState(cookieToken);
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
      setCookie(THEME_COOKIE_KEY, resolvedTheme);
      return resolvedTheme;
    });
  }, [resolvedTheme]);

  const updateThemeMode = useCallback(
    (mode: ThemeMode) => {
      syncFromProviderRef.current = true;
      setThemeModeState(mode);
      setCookie(THEME_COOKIE_KEY, mode);
      setTheme(mode);
    },
    [setTheme],
  );

  const updateAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      setCookie(TOKEN_COOKIE_KEY, token);
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
    setTheme('light');
  }, [setTheme]);

  return (
    <AppContext.Provider
      value={{
        theme: themeMode,
        accessToken,
        setThemeMode: updateThemeMode,
        setAccessToken: updateAccessToken,
        clearAppSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppContext);

