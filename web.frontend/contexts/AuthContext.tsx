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
import axios from "@/lib/axios";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookie";

type AuthContextValue = {
  accessToken: string | null;
  isDemoMode: boolean;
  setAccessToken: (token: string | null) => void;
  clearAuthSettings: () => void;
};

const defaultValue: AuthContextValue = {
  accessToken: null,
  isDemoMode: false,
  setAccessToken: () => {},
  clearAuthSettings: () => {},
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export function getTokenFromCookie() {
  return getCookie(TOKEN_COOKIE_KEY);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const cookieToken = getTokenFromCookie();

    if (cookieToken) {
      setAccessTokenState(cookieToken);
    }
  }, []);

  useEffect(() => {
    const syncDemoMode = async () => {
      if (!accessToken) {
        setIsDemoMode(false);

        return;
      }

      try {
        const { data } = await axios.get<{ isDemo?: boolean }>("/account");
        setIsDemoMode(Boolean(data?.isDemo));
      } catch {
        setIsDemoMode(false);
      }
    };

    syncDemoMode();
  }, [accessToken]);

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
    setIsDemoMode(false);
    deleteCookie(TOKEN_COOKIE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      isDemoMode,
      setAccessToken,
      clearAuthSettings,
    }),
    [accessToken, clearAuthSettings, isDemoMode, setAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
