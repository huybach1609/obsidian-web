"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { COOKIE_MAX_AGE_DAYS, TOKEN_COOKIE_KEY } from "@/lib/constants";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookie";

type AuthContextValue = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuthSettings: () => void;
};

const defaultValue: AuthContextValue = {
  accessToken: null,
  setAccessToken: () => {},
  clearAuthSettings: () => {},
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export function getTokenFromCookie() {
  return getCookie(TOKEN_COOKIE_KEY);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  useEffect(() => {
    const cookieToken = getTokenFromCookie();

    if (cookieToken) {
      setAccessTokenState(cookieToken);
    }
  }, []);

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);

    if (token) {
      setCookie(TOKEN_COOKIE_KEY, token, COOKIE_MAX_AGE_DAYS);
    } else {
      deleteCookie(TOKEN_COOKIE_KEY);
    }
  }, []);

  const clearAuthSettings = useCallback(() => {
    setAccessTokenState(null);
    deleteCookie(TOKEN_COOKIE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      setAccessToken,
      clearAuthSettings,
    }),
    [accessToken, clearAuthSettings, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
