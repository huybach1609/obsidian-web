"use client";

import { useRouter, useParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast, Button } from "@heroui/react";
import {
  ArrowUpNarrowWideIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  FilePlusCornerIcon,
  FolderPlusIcon,
} from "lucide-react";

import { LeftSideBarTop } from "@/app/_components/Bar/LeftSideBarTop";
import { SidebarShell } from "@/app/_components/Layout/SidebarShell";
import { CommandMenu } from "@/app/_components/CommandMenu";
import CreatePageModal from "@/app/_components/Modal/CreatePageModal";
import CreateFolderModal from "@/app/_components/Modal/CreateFolderModal";
import TreeView from "@/app/_components/TreeView";
import { useAppSettings } from "@/contexts/AppContext";
import {
  CreatePageProvider,
  useCreatePage,
} from "@/contexts/CreatePageContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import {
  renameFile,
  createFile,
  removeFile,
  createFolder,
} from "@/services/fileservice";
import { buildRenamedPath } from "@/utils/stringhelper";
import { usePersistedSidebarWidth } from "@/hook/usePersistedSidebarWidth";
import { useShellSidebarState } from "@/hook/useShellSidebarState";
import { useSidebar } from "@/hook/useSidebar";
import { useSidebarResize } from "@/hook/useSidebarResize";
import { TreeViewRef } from "@/app/_components/TreeView";
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

  const { sidebarWidth, setSidebarWidth } = usePersistedSidebarWidth();

  // Extract the current path from route params (same logic as in page.tsx)
  const selectedPath = decodeURIComponent(
    Array.isArray(params.path) ? params.path.join("/") : (params.path ?? ""),
  );

  // Save current path to cookie for auto-redirect on next visit
  useEffect(() => {
    // Only save if we're actually on a notes route
    if (pathname && pathname.startsWith("/notes")) {
      setLastVisitedPath(pathname);
    }
  }, [pathname, setLastVisitedPath]);

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
      const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";

      if (treeViewRef.current) {
        treeViewRef.current.refreshPath(parentPath);
      }

      // If we are currently viewing this file/folder, navigate to parent or root
      if (selectedPath === path || selectedPath.startsWith(path + "/")) {
        if (parentPath === "/") {
          router.push("/notes");
        } else {
          if (editMode) {
            router.push(`/notes/edit/${parentPath}`);
          } else {
            router.push(`/notes/${parentPath}`);
          }
        }
      }

      toast("File deleted successfully", {
        description: "The file has been deleted successfully",
        variant: "success",
        timeout: 2000,
      });
    } catch (err) {
      console.error("Failed to delete file", err);
      toast("Failed to delete file", {
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while deleting the file",
        variant: "danger",
        timeout: 3000,
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
      const basePath = createFolderPath.endsWith("/")
        ? createFolderPath
        : createFolderPath + "/";
      const fullPath = basePath + folderName.trim();

      await createFolder(fullPath);

      // Refresh the tree view to show the new folder
      if (treeViewRef.current) {
        const folderPathToRefresh = createFolderPath || "/";

        treeViewRef.current.refreshPath(folderPathToRefresh);
      }

      toast("Folder created successfully", {
        description: "The folder has been created successfully",
        variant: "success",
        timeout: 2000,
      });

      setIsFolderModalOpen(false);
      setCreateFolderPath("");
    } catch (err) {
      // console.error("Failed to create folder", err);
      toast("Failed to create folder", {
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while creating the folder",
        variant: "danger",
        timeout: 3000,
      });
      throw err;
    }
  };

  // Close folder modal without saving
  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setCreateFolderPath("");
  };

  // close modal without saving
  const handleCloseWithoutSave = () => {
    // console.log("close modal without save", createPagePath);
    setIsOpen(false);
    setCreatePagePath("");
  };

  // save and close modal (called when clicking outside or Save button)
  const handleSaveAndClose = async (fileName: string, content: string) => {
    // console.log("save and close modal", createPagePath, fileName);

    if (createPagePath && fileName) {
      try {
        // Construct full path: basePath/fileName.md
        const basePath = createPagePath.endsWith("/")
          ? createPagePath
          : createPagePath + "/";
        const fullPath = basePath + fileName;
        const response = await createFile(fullPath, content);

        // Refresh the tree view to show the new file
        if (treeViewRef.current) {
          // Refresh the parent folder where the file was created
          const folderPathToRefresh = createPagePath || "/";

          treeViewRef.current.refreshPath(folderPathToRefresh);
        }

        // Optionally navigate to the new file
        if (editMode) {
          router.push(`/notes/edit/${response.path}`);
        } else {
          router.push(`/notes/${response.path}`);
        }
        toast("File created successfully", {
          description: "The file has been created successfully",
          variant: "success",
          timeout: 2000,
        });
      } catch (err) {
        console.error("Failed to create file", err);
      }
    }
    setIsOpen(false);
    setCreatePagePath("");
  };

  return (
    <SidebarProvider
      isSidebarOpen={isSidebarVisible}
      toggleSidebar={toggleSidebar}
    >
      <SidebarShell.Root isCollapsed={isCollapsed}>
        <CommandMenu />

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

          <TreeActions
            treeViewRef={treeViewRef}
            onCreateFile={() => handleOpenCreatePage("/")}
            onCreateFolder={() => handleOpenCreateFolder("/")}
          />

          <div className="min-h-0 flex-1">
            <TreeView
              ref={treeViewRef}
              isAuthenticated={true}
              path="/"
              selectedPath={selectedPath || undefined}
              onCopyLink={(path) => {
                console.log("copy link", path);
              }}
              onCreateFolder={handleOpenCreateFolder}
              onOpenCreatePage={handleOpenCreatePage}
              onRemoveFile={handleRemoveFile}
              onRename={handleRename}
              onSelect={(path) => {
                if (editMode) {
                  router.push(`/notes/edit/${path}`);
                } else {
                  router.push(`/notes/${path}`);
                }
              }}
            />

            <CreatePageModal
              isOpen={isOpen}
              path={createPagePath}
              onCloseWithoutSave={handleCloseWithoutSave}
              onSave={handleSaveAndClose}
            />

            <CreateFolderModal
              isOpen={isFolderModalOpen}
              path={createFolderPath}
              onCloseWithoutSave={handleCloseFolderModal}
              onSave={handleSaveFolder}
            />
          </div>

          <SidebarShell.ResizeHandle
            show={!isCollapsed && !isNarrow}
            onMouseDown={handleResizeStart}
          />
        </SidebarShell.Sidebar>

        <SidebarShell.Main
          marginLeft={!isNarrow && isSidebarVisible ? sidebarWidth : 0}
        >
          {children}
        </SidebarShell.Main>
      </SidebarShell.Root>
    </SidebarProvider>
  );
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatePageProvider>
      <NotesLayoutContent>{children}</NotesLayoutContent>
    </CreatePageProvider>
  );
}

interface TreeActionsProps {
  onCreateFile: () => void;
  onCreateFolder: () => void;
  treeViewRef: React.RefObject<TreeViewRef | null>;
}

const TreeActions = ({
  onCreateFile,
  onCreateFolder,
  treeViewRef,
}: TreeActionsProps) => {
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
        isIconOnly
        id="create-file"
        size="sm"
        variant="ghost"
        onPress={onCreateFile}
      >
        <FilePlusCornerIcon className={btnstyle} />
      </Button>

      <Button
        isIconOnly
        id="create-folder"
        size="sm"
        variant="ghost"
        onPress={onCreateFolder}
      >
        <FolderPlusIcon className={btnstyle} />
      </Button>

      <Button isIconOnly id="sort" size="sm" variant="ghost">
        <ArrowUpNarrowWideIcon className={btnstyle} />
      </Button>

      <Button
        isIconOnly
        aria-label={
          hasOpenFolders ? "Collapse all folders" : "Expand folders (2 levels)"
        }
        id="collapse"
        size="sm"
        variant="ghost"
        onPress={handleToggleExpandCollapse}
      >
        {hasOpenFolders ? (
          <ChevronsDownUp className={btnstyle} />
        ) : (
          <ChevronsUpDown className={btnstyle} />
        )}
      </Button>
    </div>
  );
};
