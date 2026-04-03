"use client";

import { Button, Input, Breadcrumbs } from "@heroui/react";
import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Save, X } from "lucide-react";

import { useAppSettings } from "@/contexts/AppContext";

// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(
  () => import("@/app/_components/CodeMirrorEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center">
        Loading editor...
      </div>
    ),
  },
);

interface CreatePageModalProps {
  isOpen: boolean;
  path: string;
  onSave: (fileName: string, content: string) => void;
  onCloseWithoutSave: () => void;
}

export default function CreatePageModal({
  isOpen,
  path,
  onSave,
  onCloseWithoutSave,
}: CreatePageModalProps) {
  const [fileNameError, setFileNameError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { vimMode, vimConfig } = useAppSettings();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setContent("");
      setFileNameError("");
    }
  }, [isOpen]);

  const validateFileName = useCallback((name: string): boolean => {
    if (!name.trim()) {
      setFileNameError("File name is required");

      return false;
    }

    const invalidChars = /[\\/:]/;

    if (invalidChars.test(name)) {
      setFileNameError(
        "File name cannot contain any of these characters: \\ / :",
      );

      return false;
    }

    setFileNameError("");

    return true;
  }, []);

  const handleFileNameChange = useCallback(
    (value: string) => {
      setFileName(value);
      if (fileNameError) {
        validateFileName(value);
      }
    },
    [fileNameError, validateFileName],
  );

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!validateFileName(fileName)) {
      return;
    }
    onSave(fileName, content);
  }, [fileName, content, validateFileName, onSave]);

  const handleCloseClick = useCallback(() => {
    setFileName("");
    setContent("");
    setFileNameError("");
    onCloseWithoutSave();
  }, [onCloseWithoutSave]);

  // Escape to close, Ctrl/Cmd+S to save, body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleCloseClick();

        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    };

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleCloseClick, handleSaveClick]);

  // Focus file name when opened
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

  const parentsItem: string[] = path.split("/");

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center p-2 sm:items-center sm:p-4"
      role="dialog"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      />

      <div
        ref={panelRef}
        className="relative z-[1] flex h-[min(90vh,calc(100vh-1rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-default-200 bg-background shadow-2xl outline-none"
      >
        <h2 className="sr-only" id={titleId}>
          Create new page
        </h2>

        <div className="relative flex w-full shrink-0 items-center justify-center py-1 pt-2">
          <Breadcrumbs>
            {parentsItem.map((item: string, idx: number) => (
              <Breadcrumbs.Item
                key={idx}
                href={idx < parentsItem.length - 1 ? "#" : undefined}
              >
                {item}
              </Breadcrumbs.Item>
            ))}
          </Breadcrumbs>

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-2 sm:right-4">
            <Button
              isIconOnly
              isDisabled={!fileName.trim() || !!fileNameError}
              variant="ghost"
              onPress={handleSaveClick}
            >
              <Save className="h-4 w-4" />
            </Button>

            <Button isIconOnly variant="ghost" onPress={handleCloseClick}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-2">
          <Input
            aria-label="File name"
            className={`w-full text-lg font-semibold text-foreground ${
              fileNameError
                ? "bg-danger/20 dark:bg-danger/20"
                : "bg-warning/30 dark:bg-warning/30 hover:bg-warning/40 dark:hover:bg-warning/40"
            }`}
            placeholder="Untitled"
            value={fileName}
            variant="primary"
            onChange={(e) => handleFileNameChange(e.target.value)}
          />
        </div>

        <div className="h-px shrink-0 bg-default-200" />

        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{
            height: "calc(100vh - 200px)",
            minHeight: "500px",
          }}
        >
          <CodeMirrorEditor
            initialContent={content}
            theme={theme === "dark" ? "dark" : "light"}
            useVim={vimMode}
            vimConfig={vimConfig}
            onChange={handleContentChange}
          />
        </div>

        <div className="shrink-0 border-t border-default-200" />
      </div>
    </div>,
    document.body,
  );
}
