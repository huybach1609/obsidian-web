"use client";

import { useRouter } from "next/navigation";

import { LeftSideBarTop } from "@/app/_components/Bar/LeftSideBarTop";
import { SidebarShell } from "@/app/_components/Layout/SidebarShell";
import { SettingSideBarBottom } from "@/app/_components/Bar/SettingSideBarBottom";
import { useAuthSettings, useEditorSettings } from "@/contexts/AppContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { usePersistedSidebarWidth } from "@/hook/usePersistedSidebarWidth";
import { useShellSidebarState } from "@/hook/useShellSidebarState";
import { useSidebar } from "@/hook/useSidebar";
import { useSidebarResize } from "@/hook/useSidebarResize";
import Header from "@/app/_components/Header";
import { Button } from "@heroui/react";
import { PanelLeftIcon } from "lucide-react";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isMobile, isWebView } = usePlatform();
  const { setAccessToken } = useAuthSettings();
  const { pageTitle } = useEditorSettings();
  const { sidebarWidth, setSidebarWidth } = usePersistedSidebarWidth();
  const handleLogout = () => {
    setAccessToken(null);
    router.push("/login");
  };

  const {
    isCollapsed: desktopCollapsed,
    sidebarRef,
    isSidebarVisible: desktopSidebarVisible,
    sidebarVariants,
    handleMouseEnter,
    handleMouseLeave,
    toggle: desktopToggleSidebar,
  } = useSidebar(isMobile, isWebView, {
    sidebarWidth: sidebarWidth,
  });

  const isNarrow = isMobile || isWebView;
  const {
    isSidebarVisible,
    isCollapsed,
    toggleSidebar,
    closeNarrowSidebar,
    showNarrowBackdrop,
  } = useShellSidebarState(isNarrow, {
    isCollapsed: desktopCollapsed,
    isSidebarVisible: desktopSidebarVisible,
    toggle: desktopToggleSidebar,
  });

  const { handleResizeStart } = useSidebarResize(sidebarWidth, setSidebarWidth);

  return (
    <SidebarProvider
      isSidebarOpen={isSidebarVisible}
      toggleSidebar={toggleSidebar}
    >
      <SidebarShell.Root isCollapsed={isCollapsed}>
        <SidebarShell.MobileBackdrop
          show={showNarrowBackdrop}
          onClose={closeNarrowSidebar}
        />

        <SidebarShell.Sidebar
          animate={isSidebarVisible ? "expanded" : "collapsed"}
          isCollapsed={isCollapsed}
          sidebarRef={sidebarRef}
          sidebarWidth={sidebarWidth}
          variants={sidebarVariants}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <LeftSideBarTop
            handleLogout={handleLogout}
            isCollapsed={isCollapsed}
            isMobile={isNarrow}
            onToggleSidebar={toggleSidebar}
          />
          <SettingSideBarBottom />

          <SidebarShell.ResizeHandle
            show={!isCollapsed && !isNarrow}
            onMouseDown={handleResizeStart}
          />
        </SidebarShell.Sidebar>

        <SidebarShell.Main
          marginLeft={!isNarrow && isSidebarVisible ? sidebarWidth : 0}
        >
          <Header className="sticky top-0 z-10 w-full shrink-0 bg-background/50 backdrop-blur-sm flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {pageTitle.title}
              </h1>
              <p className="text-foreground/60 mt-2">{pageTitle.description}</p>
            </div>
            {isMobile && (
              <Button
                isIconOnly
                aria-label="Toggle sidebar"
                className="z-50 p-0 md:p-5"
                size="sm"
                variant="tertiary"
                onPress={() => toggleSidebar()}
              >
                <PanelLeftIcon className="h-5 w-5" />
              </Button>
            )}
          </Header>

          {children}
        </SidebarShell.Main>
      </SidebarShell.Root>
    </SidebarProvider>
  );
};

export default SettingsLayout;
