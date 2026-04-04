"use client";

import { PanelLeftIcon } from "lucide-react";
import { Button } from "@heroui/react";

import HelpSheet from "@/app/_components/HelpSheet";
import { usePlatform } from "@/contexts/PlatformContext";
import { useSidebarContext } from "@/contexts/SidebarContext";

export default function NotesPage() {
  const { isMobile, isWebView } = usePlatform();
  const sidebar = useSidebarContext();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground p-4 sm:p-0">
      {(isMobile || isWebView) && sidebar && (
        <Button
          isIconOnly
          aria-label="Toggle sidebar"
          className=" p-16 m-0"
          size="sm"
          variant="tertiary"
          onPress={() => sidebar.toggleSidebar()}
        >
          <PanelLeftIcon className="h-16 w-16 text-foreground/60 " />
        </Button>
      )}
      <h2 className="text-xl font-semibold text-foreground/80">
        No File Selected
      </h2>
      <p className="text-foreground/60 mt-2">
        Select a file from the sidebar to preview
      </p>
      <HelpSheet />
    </div>
  );
}
