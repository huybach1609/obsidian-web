"use client";

import { Button, Input } from "@heroui/react";
import { useState, useEffect, useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Save, X } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Escape to close, lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCloseClick();
      }
    };

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleCloseClick]);

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

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
    >
      {/* Backdrop — not clickable to dismiss (same as previous isDismissable={false}) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-background/50 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        className="relative z-[1] w-full max-w-lg rounded-[var(--radius)] border border-default-200 bg-background p-4 shadow-2xl outline-none"
      >
        <h2 className="sr-only" id={titleId}>
          Create folder
        </h2>
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
      </div>
    </div>,
    document.body,
  );
}
