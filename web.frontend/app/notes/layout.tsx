'use client';

import { LeftSideBarTop } from "@/components/Bar/LeftSideBarTop";
import { CommandMenu } from "@/components/CommandMenu";
import CreatePageModal from "@/components/Modal/CreatePageModal";
import CreateFolderModal from "@/components/Modal/CreateFolderModal";
import TreeView from "@/components/TreeView";
import { useAppSettings } from "@/contexts/AppContext";
import { CreatePageProvider, useCreatePage } from "@/contexts/CreatePageContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { renameFile, createFile, removeFile, createFolder } from "@/services/fileservice";
import { buildRenamedPath } from "@/utils/stringhelper";
import { useRouter, useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/hook/useSidebar";
import { twMerge } from "tailwind-merge";
import { useState, useRef, useEffect, useCallback } from "react";
import { addToast, Button, cn } from "@heroui/react";
import { TreeViewRef } from "@/components/TreeView";
import { ArrowDownNarrowWideIcon, ArrowUpNarrowWideIcon, ChevronsDownUp, ChevronsUpDown, FilePlusCornerIcon, FolderPlusIcon } from "lucide-react";
import { siteConfig } from "@/config/site";

function NotesLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { isMobile, isWebView } = usePlatform();
  const { setAccessToken, editMode, setLastVisitedPath } = useAppSettings();
  const { setIsOpen, isOpen } = useCreatePage();
  const [createPagePath, setCreatePagePath] = useState<string>("");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [createFolderPath, setCreateFolderPath] = useState<string>("");
  const treeViewRef = useRef<TreeViewRef>(null);

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

  // Extract the current path from route params (same logic as in page.tsx)
  const selectedPath = decodeURIComponent(
    Array.isArray(params.path)
      ? params.path.join('/')
      : params.path ?? ''
  );

  // Save current path to cookie for auto-redirect on next visit
  useEffect(() => {
    // Only save if we're actually on a notes route
    if (pathname && pathname.startsWith('/notes')) {
      setLastVisitedPath(pathname);
    }
  }, [pathname, setLastVisitedPath]);

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

  const handleRemoveFile = async (path: string) => {
    try {
      await removeFile(path);

      // Get parent path to refresh tree view
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      if (treeViewRef.current) {
        treeViewRef.current.refreshPath(parentPath);
      }

      // If we are currently viewing this file/folder, navigate to parent or root
      if (selectedPath === path || selectedPath.startsWith(path + '/')) {
        if (parentPath === '/') {
          router.push('/notes');
        } else {
          if (editMode) {
            router.push(`/notes/edit/${parentPath}`);
          } else {
            router.push(`/notes/${parentPath}`);
          }
        }
      }

      addToast({
        title: "File deleted successfully",
        description: "The file has been deleted successfully",
        color: "success",
        hideIcon: false,
        timeout: 2000,
        classNames: {
          base: cn([
            "bg-background/50 text-foreground",
            "backdrop-blur-sm",
          ]),
          closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
        },
      });
    } catch (err) {
      console.error("Failed to delete file", err);
      addToast({
        title: "Failed to delete file",
        description: err instanceof Error ? err.message : "An error occurred while deleting the file",
        color: "danger",
        hideIcon: false,
        timeout: 3000,
        classNames: {
          base: cn([
            "bg-background/50 text-foreground",
            "backdrop-blur-sm",
          ]),
          closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
        },
      });
    }
  };

  // set path 
  const handleOpenCreatePage = (path: string) => {
    console.log("open create page", path);
    setCreatePagePath(path);
    setIsOpen(true);
  };

  // Open create folder modal
  const handleOpenCreateFolder = (path: string) => {
    console.log("open create folder", path);
    setCreateFolderPath(path);
    setIsFolderModalOpen(true);
  };

  // Save folder
  const handleSaveFolder = async (folderName: string) => {
    try {
      const basePath = createFolderPath.endsWith('/') ? createFolderPath : createFolderPath + '/';
      const fullPath = basePath + folderName.trim();
      await createFolder(fullPath);

      // Refresh the tree view to show the new folder
      if (treeViewRef.current) {
        const folderPathToRefresh = createFolderPath || '/';
        treeViewRef.current.refreshPath(folderPathToRefresh);
      }

      addToast({
        title: "Folder created successfully",
        description: "The folder has been created successfully",
        color: "success",
        hideIcon: false,
        timeout: 2000,
        classNames: {
          base: cn([
            "bg-background/50 text-foreground",
            "backdrop-blur-sm",
          ]),
          closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
        },
      });

      setIsFolderModalOpen(false);
      setCreateFolderPath("");
    } catch (err) {
      console.error("Failed to create folder", err);
      addToast({
        title: "Failed to create folder",
        description: err instanceof Error ? err.message : "An error occurred while creating the folder",
        color: "danger",
        hideIcon: false,
        timeout: 3000,
        classNames: {
          base: cn([
            "bg-background/50 text-foreground",
            "backdrop-blur-sm",
          ]),
          closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
        },
      });
    }
  };

  // Close folder modal without saving
  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setCreateFolderPath("");
  };

  // close modal without saving
  const handleCloseWithoutSave = () => {
    console.log("close modal without save", createPagePath);
    setIsOpen(false);
    setCreatePagePath("");
  };

  // save and close modal (called when clicking outside or Save button)
  const handleSaveAndClose = async (fileName: string, content: string) => {
    console.log("save and close modal", createPagePath, fileName);

    if (createPagePath && fileName) {
      try {
        // Construct full path: basePath/fileName.md
        const basePath = createPagePath.endsWith('/') ? createPagePath : createPagePath + '/';
        const fullPath = basePath + fileName;
        const response = await createFile(fullPath, content);

        // Refresh the tree view to show the new file
        if (treeViewRef.current) {
          // Refresh the parent folder where the file was created
          const folderPathToRefresh = createPagePath || '/';
          treeViewRef.current.refreshPath(folderPathToRefresh);
        }

        // Optionally navigate to the new file
        if (editMode) {
          router.push(`/notes/edit/${response.path}`);
        } else {
          router.push(`/notes/${response.path}`);
        }
        addToast({
          title: "File created successfully",
          description: "The file has been created successfully",
          color: "success",
          hideIcon: false,
          timeout: 2000,
          classNames: {
            base: cn([
              "bg-background/50 text-foreground",
              "backdrop-blur-sm",
            ]),
            closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
          },
        });
      } catch (err) {
        console.error("Failed to create file", err);
      }
    }
    setIsOpen(false);
    setCreatePagePath("");
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

        <TreeActions
          onCreateFile={() => handleOpenCreatePage("/")}
          onCreateFolder={() => handleOpenCreateFolder("/")}
          treeViewRef={treeViewRef}
        />

        <div className="flex-1 min-h-0">
          <TreeView
            ref={treeViewRef}
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
            onRemoveFile={handleRemoveFile}
            onRename={handleRename}
            onOpenCreatePage={handleOpenCreatePage}
            onCreateFolder={handleOpenCreateFolder}
            isAuthenticated={true}
          />

          <CreatePageModal
            isOpen={isOpen}
            path={createPagePath}
            onSave={handleSaveAndClose}
            onCloseWithoutSave={handleCloseWithoutSave}
          />

          <CreateFolderModal
            isOpen={isFolderModalOpen}
            path={createFolderPath}
            onSave={handleSaveFolder}
            onCloseWithoutSave={handleCloseFolderModal}
          />
        </div>

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
  )
}

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreatePageProvider>
      <NotesLayoutContent>{children}</NotesLayoutContent>
    </CreatePageProvider>
  );
}

interface TreeActionsProps {
  onCreateFile: () => void;
  onCreateFolder: () => void;
  treeViewRef: React.RefObject<TreeViewRef>;
}

const TreeActions = ({ onCreateFile, onCreateFolder, treeViewRef }: TreeActionsProps) => {
  const btnstyle = "h-5 w-5 text-foreground";
  const [hasOpenFolders, setHasOpenFolders] = useState(false);

  // Check if any folders are open
  const checkOpenFolders = () => {
    if (treeViewRef.current) {
      const hasOpen = treeViewRef.current.hasOpenFolders();
      setHasOpenFolders(hasOpen);
    }
  };

  // Check on mount and periodically
  useEffect(() => {
    checkOpenFolders();
    const interval = setInterval(checkOpenFolders, 500); // Check every 500ms
    return () => clearInterval(interval);
  }, []);

  const handleToggleExpandCollapse = async () => {
    if (!treeViewRef.current) return;

    if (hasOpenFolders) {
      // Collapse all folders
      treeViewRef.current.collapseAll();
    } else {
      // Expand to 2 levels (expand 2 child folders)
      treeViewRef.current.expandToLevel(siteConfig.expandLevel || 2);
    }

    // Check after toggle operation completes
    setTimeout(checkOpenFolders, 200);
  };

  return (
    <div className="flex items-center gap-2 pt-2 w-full justify-center">
      <Button
        id="create-file"
        variant="light"
        isIconOnly
        size="sm"
        onPress={onCreateFile}
      >
        <FilePlusCornerIcon className={btnstyle} />
      </Button>

      <Button
        id="create-folder"
        variant="light"
        isIconOnly
        size="sm"
        onPress={onCreateFolder}
      >
        <FolderPlusIcon className={btnstyle} />
      </Button>

      <Button id="sort" variant="light" isIconOnly size="sm" >
        <ArrowUpNarrowWideIcon className={btnstyle} />
      </Button>

      <Button
        id="collapse"
        variant="light"
        isIconOnly
        size="sm"
        onPress={handleToggleExpandCollapse}
        title={hasOpenFolders ? "Collapse all folders" : "Expand folders (2 levels)"}
      >
        {hasOpenFolders ? (
          <ChevronsDownUp className={btnstyle} />
        ) : (
          <ChevronsUpDown className={btnstyle} />
        )}
      </Button>
    </div>
  )
}