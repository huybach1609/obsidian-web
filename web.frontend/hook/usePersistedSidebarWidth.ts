"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

export function usePersistedSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = parseInt(saved, 10);

      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setSidebarWidth(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, sidebarWidth.toString());
    }
  }, [sidebarWidth, isHydrated]);

  return { sidebarWidth, setSidebarWidth };
}
