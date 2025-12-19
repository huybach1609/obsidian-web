'use client';

import { LeftSideBarTop } from "@/components/Bar/LeftSideBarTop";
import { CommandMenu } from "@/components/CommandMenu";
import TreeView from "@/components/TreeView";
import { useAppSettings } from "@/contexts/AppContext";
import { usePlatform } from "@/contexts/PlatformContext";
import { renameFile } from "@/services/fileservice";
import { buildRenamedPath } from "@/utils/stringhelper";
import { useRouter, useParams } from "next/navigation";

export default function NotesLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const params = useParams();
    const { isMobile, isWebView } = usePlatform();
    const { setAccessToken, editMode } = useAppSettings();

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
    // Desktop: show sidebar and content
    return (
        <div className="flex h-screen bg-background text-foreground">
        <CommandMenu />
        
        {/* Left Sidebar - Always Visible */}
        <div className=" bg-background flex flex-col min-w-64">
          <LeftSideBarTop handleLogout={handleLogout} isMobile={false} />
          <div className="flex-1 overflow-y-auto">
            <TreeView
              path="/"
              selectedPath={selectedPath || undefined}
              onSelect={(path) => {
                if(editMode){
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
              isAuthenticated={true}
            />
          </div>
        </div>
  
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    )
}
