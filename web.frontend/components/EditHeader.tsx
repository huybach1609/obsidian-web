'use client';

import { useParams, useRouter } from "next/navigation";
import { decodePathParam } from "@/utils/stringhelper";
import { SaveIcon, PencilOffIcon, PencilIcon } from "lucide-react";
import { Button } from "@heroui/react";
import { useAppSettings } from "@/contexts/AppContext";
import { useEditPage } from "@/contexts/EditPageContext";
import { twMerge } from "tailwind-merge";
import Header from "./Header";

export default function EditHeader() {
  const params = useParams();
  const filePath = decodePathParam(params.path as string | string[] | undefined);
  const router = useRouter();
  const { vimMode, setVimMode } = useAppSettings();
  const { hasChanges, isSaving, onSave } = useEditPage();

  return (
    <Header className="top-0 z-10 absolute w-full bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full w-full">
        <div className="">
          <div className="flex items-center gap-2">
            <PencilIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Edit</h3>
            <span className={twMerge(
              "text-sm text-gray-500 truncate max-w-md",
              hasChanges && "text-orange-500 italic"
            )}>
              {filePath} {hasChanges && '*'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            variant={vimMode ? "solid" : "flat"}
            size="sm"
            color={vimMode ? "primary" : "default"}
            onPress={() => setVimMode(!vimMode)}
            aria-label="toggle vim mode"
            title={vimMode ? "Disable Vim mode" : "Enable Vim mode"}
          >
            <img src="/Vimlogo.svg" alt="Vim" className="h-4 w-4" />
          </Button>
          <Button
            variant="flat"
            size="sm"
            color={hasChanges ? "primary" : "default"}
            onPress={onSave || undefined}
            isLoading={isSaving}
            startContent={!isSaving && <SaveIcon className="h-4 w-4" />}
          >
            Save {hasChanges && '*'}
          </Button>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => router.push(`/notes/${filePath}`)}
            aria-label="preview"
          >
            <PencilOffIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Header>
  );
}

