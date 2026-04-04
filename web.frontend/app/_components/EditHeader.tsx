"use client";

import { useParams, useRouter } from "next/navigation";
import {
  SaveIcon,
  PencilOffIcon,
  PencilIcon,
  PanelLeftIcon,
} from "lucide-react";
import { Button, ButtonGroup } from "@heroui/react";
import { twMerge } from "tailwind-merge";

import Header from "./Header";

import { useAppSettings } from "@/contexts/AppContext";
import { useEditPage } from "@/contexts/EditPageContext";
import { decodePathParam } from "@/utils/stringhelper";
import { VimLogoIcon } from "@/app/_components/icons/VimLogoIcon";
import { usePlatform } from "@/contexts/PlatformContext";
import { useSidebarContext } from "@/contexts/SidebarContext";

export default function EditHeader() {
  const params = useParams();
  const filePath = decodePathParam(
    params.path as string | string[] | undefined,
  );
  const router = useRouter();
  const { vimMode, setVimMode } = useAppSettings();
  const { hasChanges, isSaving, onSave } = useEditPage();
  const { isMobile, isWebView } = usePlatform();
  const sidebar = useSidebarContext();

  return (
    <Header className="sticky top-0 z-10 w-full shrink-0 bg-background/50 backdrop-blur-sm">
      <div className="flex w-full min-w-0 items-start justify-between gap-2 md:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-2">
          <div className="flex shrink-0 items-center gap-2">
            <PencilIcon className="h-5 w-5 shrink-0" />
            <h3 className="text-lg font-semibold">Edit</h3>
          </div>
          <span
            className={twMerge(
              "min-w-0 truncate text-sm text-gray-500 md:max-w-[min(100%,28rem)]",
              hasChanges && "text-orange-500 italic",
            )}
          >
            {filePath} {hasChanges && "*"}
          </span>
        </div>
        {(isMobile || isWebView) && sidebar && (
          <Button
            isIconOnly
            aria-label="Toggle sidebar"
            className="z-50 p-0 md:p-5"
            size="sm"
            variant="tertiary"
            onPress={() => sidebar.toggleSidebar()}
          >
            <PanelLeftIcon className="h-5 w-5" />
          </Button>
        )}
        <ButtonGroup>
          <Button
            isIconOnly
            aria-label="toggle vim mode"
            className="p-0 md:p-5"
            size="sm"
            variant={vimMode ? "primary" : "tertiary"}
            onPress={() => setVimMode(!vimMode)}
          >
            <VimLogoIcon className="h-4 w-4" />
          </Button>
          <Button
            className="p-0 md:p-5"
            isIconOnly={isMobile}
            size="sm"
            variant={hasChanges ? "primary" : "tertiary"}
            onPress={onSave || undefined}
          >
            <ButtonGroup.Separator />
            <span className="inline-flex items-center gap-2">
              {!isSaving && <SaveIcon className="h-4 w-4" />}
              {!isMobile && <span>Save {hasChanges && "*"}</span>}
            </span>
          </Button>

          <Button
            isIconOnly
            aria-label="preview"
            className="p-0 md:p-5"
            size="sm"
            variant="tertiary"
            onPress={() => router.push(`/notes/${filePath}`)}
          >
            <ButtonGroup.Separator />
            <PencilOffIcon className="h-5 w-5" />
          </Button>
        </ButtonGroup>
      </div>
    </Header>
  );
}
