"use client";

import { Button, Input } from "@heroui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Save, X } from "lucide-react";

import { AppModal } from "@/app/_components/Modal/AppModal";

interface CreateFolderModalProps {
  isOpen: boolean;
  path: string;
  /** Return a Promise so the modal can stay open when save fails (parent should reject). */
  onSave: (folderName: string) => void | Promise<void>;
  onCloseWithoutSave: () => void;
}

export default function CreateFolderModal({
  isOpen,
  path: _path,
  onSave,
  onCloseWithoutSave,
}: CreateFolderModalProps) {
  const [folderNameError, setFolderNameError] = useState<string>("");
  const [folderName, setFolderName] = useState<string>("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Reset form when the modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderName("");
      setFolderNameError("");
    }
  }, [isOpen]);

  const validateFolderName = useCallback((name: string): boolean => {
    if (!name.trim()) {
      setFolderNameError("Folder name is required");

      return false;
    }

    const invalidChars = /[\\/:]/;

    if (invalidChars.test(name)) {
      setFolderNameError(
        "Folder name cannot contain any of these characters: \\ / :",
      );

      return false;
    }

    setFolderNameError("");

    return true;
  }, []);

  const handleFolderNameChange = useCallback(
    (value: string) => {
      setFolderName(value);
      if (folderNameError) {
        validateFolderName(value);
      }
    },
    [folderNameError, validateFolderName],
  );

  const handleCloseClick = useCallback(() => {
    setFolderName("");
    setFolderNameError("");
    onCloseWithoutSave();
  }, [onCloseWithoutSave]);

  const handleSave = useCallback(async () => {
    if (!validateFolderName(folderName)) {
      return;
    }
    try {
      await Promise.resolve(onSave(folderName));
    } catch {
      // Error feedback is handled by the parent `onSave` implementation.
    }
  }, [folderName, onSave, validateFolderName]);

  // Focus the panel when opened (focus moves inside dialog for a11y)
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLInputElement>(
        'input[data-slot="input"], input[type="text"], input:not([type="hidden"])',
      );

      el?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [isOpen]);

  return (
    <AppModal.Root isOpen={isOpen} onClose={handleCloseClick}>
      <AppModal.Backdrop className="bg-background/50 backdrop-blur-[2px]" />
      <AppModal.Panel
        ref={panelRef}
        className="w-full max-w-lg  border border-default-200 bg-background p-2 shadow-2xl"
      >
        <AppModal.Title>Create folder</AppModal.Title>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Folder name"
            className="w-full"
            placeholder="Untitled"
            value={folderName}
            variant="primary"
            onChange={(e) => handleFolderNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
            }}
          />

          <div className="flex shrink-0 items-center gap-2">
            <Button
              isIconOnly
              isDisabled={!folderName.trim() || !!folderNameError}
              variant="ghost"
              onPress={() => void handleSave()}
            >
              <Save className="h-4 w-4" />
            </Button>

            <Button isIconOnly variant="ghost" onPress={handleCloseClick}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AppModal.Panel>
    </AppModal.Root>
  );
}
