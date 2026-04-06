"use client";

import { useCallback, useState } from "react";

type DesktopSidebar = {
  isCollapsed: boolean;
  isSidebarVisible: boolean;
  toggle: () => void;
};

/**
 * Merges desktop `useSidebar` behavior with a separate open state for
 * mobile / WebView overlay drawers.
 */
export function useShellSidebarState(
  isNarrow: boolean,
  desktop: DesktopSidebar,
) {
  const [narrowOpen, setNarrowOpen] = useState(false);

  const isSidebarVisible = isNarrow ? narrowOpen : desktop.isSidebarVisible;
  const isCollapsed = isNarrow ? !narrowOpen : desktop.isCollapsed;

  const toggleSidebar = useCallback(() => {
    if (isNarrow) {
      setNarrowOpen((o) => !o);
    } else {
      desktop.toggle();
    }
  }, [isNarrow, desktop.toggle]);

  const closeNarrowSidebar = useCallback(() => {
    if (isNarrow) {
      setNarrowOpen(false);
    }
  }, [isNarrow]);

  return {
    isSidebarVisible,
    isCollapsed,
    toggleSidebar,
    closeNarrowSidebar,
    showNarrowBackdrop: isNarrow && narrowOpen,
  };
}
