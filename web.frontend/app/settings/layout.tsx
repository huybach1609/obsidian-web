'use client';

import { LeftSideBarTop } from "@/components/Bar/LeftSideBarTop";
import { useAppSettings } from "@/contexts/AppContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/hook/useSidebar";
import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect, useCallback } from "react";
import { SettingSideBarBottom } from "@/components/Bar/SettingSideBarBottom";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isMobile, isWebView } = usePlatform();
  const { setAccessToken } = useAppSettings();

  // Sidebar configuration - width is configurable (default: 256px)
  // Initialize with default to avoid hydration mismatch
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem('sidebar-width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 200 && parsed <= 600) {
        setSidebarWidth(parsed);
      }
    }
  }, []);

  // Save to localStorage when width changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth, isHydrated]);

  // Resize handle state
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleLogout = () => {
    setAccessToken(null);
    router.push('/login');
  };

  // Use sidebar hook for all sidebar logic
  const {
    isCollapsed,
    sidebarRef,
    isSidebarVisible,
    sidebarVariants,
    handleMouseEnter,
    handleMouseLeave,
    toggle: toggleSidebar,
  } = useSidebar(isMobile, isWebView, {
    sidebarWidth: sidebarWidth,
  });

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const diff = e.clientX - resizeStartX.current;
    const newWidth = Math.max(200, Math.min(600, resizeStartWidth.current + diff));
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Mobile: Hide sidebar, show only content
  if (isMobile || isWebView) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <LeftSideBarTop handleLogout={handleLogout} isMobile={true} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Desktop: show sidebar and content with animation
  return (
    <div className={twMerge("flex h-screen bg-background text-foreground relative",
      isCollapsed ? "flex-row" : "flex-col")}>
      
      {/* Left Sidebar - Animated with Framer Motion, remains mounted when collapsed */}
      <motion.div
        ref={sidebarRef}
        className={twMerge(
          "bg-background flex flex-col fixed left-0 z-40",
          isCollapsed
            ? "bg-background/80 rounded-r-lg w-10 h-[90%] border-1 border-foreground/20 top-1/2 -translate-y-1/2"
            : "top-0 bottom-0"
        )}
        style={{ width: sidebarWidth }}
        variants={sidebarVariants}
        animate={isSidebarVisible ? 'expanded' : 'collapsed'}
        initial={false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <LeftSideBarTop
          handleLogout={handleLogout}
          isMobile={false}
          onToggleSidebar={toggleSidebar}
          isCollapsed={isCollapsed}
        />
        <SettingSideBarBottom />

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:w-1.5 hover:bg-primary/30 transition-all z-50 group"
            onMouseDown={handleResizeStart}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-foreground/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </motion.div>

      {/* Main Content Area - Smoothly adjusts based on sidebar state */}
      <motion.div
        className="flex-1 min-w-0"
        style={{
          marginLeft: isSidebarVisible ? sidebarWidth : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 70,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SettingsLayout;