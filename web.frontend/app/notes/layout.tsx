'use client';

import { LeftSideBarTop } from "@/components/Bar/LeftSideBarTop";
import { CommandMenu } from "@/components/CommandMenu";
import CreatePageModal from "@/components/Modal/CreatePageModal";
import TreeView from "@/components/TreeView";
import { useAppSettings } from "@/contexts/AppContext";
import { CreatePageProvider, useCreatePage } from "@/contexts/CreatePageContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { renameFile } from "@/services/fileservice";
import { buildRenamedPath } from "@/utils/stringhelper";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/hook/useSidebar";
import { twMerge } from "tailwind-merge";

function NotesLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { isMobile, isWebView } = usePlatform();
  const { setAccessToken, editMode } = useAppSettings();
  const { setIsOpen, isOpen } = useCreatePage();

  // Sidebar configuration - width is configurable (default: 256px)
  const SIDEBAR_WIDTH = 256;

  // Extract the current path from route params (same logic as in page.tsx)
  const selectedPath = decodeURIComponent(
    Array.isArray(params.path)
      ? params.path.join('/')
      : params.path ?? ''
  );

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
    sidebarWidth: SIDEBAR_WIDTH,
  });

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

  const handleRename = async (oldPath: string, newName: string) => {
    const newPath = buildRenamedPath(oldPath, newName);

    try {
      await renameFile(oldPath, newPath);

      // If we are currently viewing this file, navigate to the new path
      if (selectedPath === oldPath) {
        if (editMode) {
          router.push(`/notes/edit/${newPath}`);
        } else {
          router.push(`/notes/${newPath}`);
        }
      }
    } catch (err) {
      console.error("Failed to rename file", err);
    }
  };

  const handleOpenCreatePage = (path: string) => {
    console.log("open create page", path);
    setIsOpen(true);
  };

  // Desktop: show sidebar and content with animation
  return (
    <div className={twMerge("flex h-screen bg-background text-foreground relative",
     isCollapsed ? "flex-row" : "flex-col")}>
      <CommandMenu />
      
      {/* Left Sidebar - Animated with Framer Motion, remains mounted when collapsed */}
      {/* Animation: Uses translateX to slide in/out, not width changes */}
      <motion.div
        ref={sidebarRef}
        className={twMerge(
          "bg-background flex flex-col fixed left-0 z-40",
          isCollapsed 
            ? "bg-background/80 rounded-r-lg w-10 h-[90%] border-1 border-foreground/20 top-1/2 -translate-y-1/2" 
            : "top-0 bottom-0"
        )}
        style={{ width: SIDEBAR_WIDTH }}
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

        <div className="flex-1 overflow-y-auto ">
          <TreeView
            path="/"
            selectedPath={selectedPath || undefined}
            onSelect={(path) => {
              if (editMode) {
                router.push(`/notes/edit/${path}`)
              } else {
                router.push(`/notes/${path}`)
              }
            }}
            onCopyLink={(path) => {
              console.log("copy link", path);
            }}
            onRemoveFile={(path) => {
              console.log("remove file", path);
            }}
            onRename={handleRename}
            onOpenCreatePage={handleOpenCreatePage}
            isAuthenticated={true}
          />
          <CreatePageModal isOpen={isOpen} onOpen={() => { }} onClose={() => { }} />
        </div>
      </motion.div>

      {/* Main Content Area - Smoothly adjusts based on sidebar state */}
      <motion.div
        className="flex-1 min-w-0"
        style={{
          marginLeft: isSidebarVisible ? SIDEBAR_WIDTH : 0,
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
  )
}

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreatePageProvider>
      <NotesLayoutContent>{children}</NotesLayoutContent>
    </CreatePageProvider>
  );
}

