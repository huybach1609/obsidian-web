"use client";

import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Save, X } from "lucide-react";

import { AppModal } from "@/app/_components/Modal/AppModal";
import { useAppSettings } from "@/contexts/AppContext";

// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(
  () => import("@/app/_components/CodeMirrorEditor"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-live="polite"
        className="flex min-h-[8rem] flex-1 items-center justify-center text-small text-default-500"
        role="status"
      >
        Loading editor…
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
  const { theme } = useTheme();
  const { vimMode, vimConfig } = useAppSettings();
  const panelRef = useRef<HTMLDivElement | null>(null);

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
    const dirty = fileName.trim().length > 0 || content.trim().length > 0;

    if (
      dirty &&
      typeof window !== "undefined" &&
      !window.confirm(
        "Discard this page? Your title and any content you entered will be lost.",
      )
    ) {
      return;
    }
    setFileName("");
    setContent("");
    setFileNameError("");
    onCloseWithoutSave();
  }, [content, fileName, onCloseWithoutSave]);

  const handleFileNameBlur = useCallback(() => {
    if (fileName.trim() || fileNameError) {
      validateFileName(fileName);
    }
  }, [fileName, fileNameError, validateFileName]);

  const handleWindowKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    },
    [handleSaveClick],
  );

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

  const parentsItem: string[] = useMemo(
    () => path.split("/").filter(Boolean),
    [path],
  );
  const saveLocationTitle = parentsItem.length > 0 ? parentsItem.join("/") : "";

  return (
    <AppModal.Root
      className="p-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4"
      isOpen={isOpen}
      onClose={handleCloseClick}
      onWindowKeyDown={handleWindowKeyDown}
    >
      <AppModal.Backdrop className="bg-black/50 backdrop-blur-[1px]" />
      <AppModal.Panel
        ref={panelRef}
        className="flex h-[min(90dvh,calc(100dvh-1rem))] w-full max-w-5xl flex-col overflow-hidden border border-default-200 bg-background shadow-2xl"
      >
        <AppModal.Title>Create page</AppModal.Title>

        <div className="flex shrink-0 flex-col gap-2">
          <header className="flex items-start justify-between gap-3 sm:items-center">
            <nav
              aria-label="Save location"
              className="min-w-0 flex-1 text-small leading-snug text-default-600"
            >
              {parentsItem.length > 0 ? (
                <p className="m-0 truncate" title={saveLocationTitle}>
                  {parentsItem.map((item: string, idx: number) => (
                    <Fragment key={`${idx}-${item}`}>
                      {idx > 0 ? (
                        <span
                          aria-hidden
                          className="select-none px-0.5 text-default-400"
                        >
                          /
                        </span>
                      ) : null}
                      <span
                        className={
                          idx === parentsItem.length - 1
                            ? "font-medium text-foreground"
                            : undefined
                        }
                      >
                        {item}
                      </span>
                    </Fragment>
                  ))}
                </p>
              ) : (
                <p className="m-0 truncate font-medium text-foreground">
                  Vault
                </p>
              )}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                isIconOnly
                aria-label="Save new page"
                className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                isDisabled={!fileName.trim() || !!fileNameError}
                variant="tertiary"
                onPress={handleSaveClick}
              >
                <Save className="size-4" />
              </Button>

              <Button
                isIconOnly
                aria-label="Close without saving"
                className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                variant="tertiary"
                onPress={handleCloseClick}
              >
                <X className="size-4" />
              </Button>
            </div>
          </header>

          <TextField
            className="w-full"
            isInvalid={!!fileNameError}
            validationBehavior="aria"
            value={fileName}
            onChange={handleFileNameChange}
          >
            <Label className="sr-only">File name</Label>
            <Input
              className={`w-full text-base font-semibold text-foreground transition-colors sm:text-lg ${
                fileNameError ? "bg-danger/20 dark:bg-danger/20" : ""
              }`}
              maxLength={255}
              placeholder="Untitled"
              variant="secondary"
              onBlur={handleFileNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveClick();
                }
              }}
            />
            <Description className="text-xs leading-normal text-default-500">
              {"Avoid \\ / :. Up to 255 characters."}
            </Description>
            {fileNameError ? <FieldError>{fileNameError}</FieldError> : null}
          </TextField>
        </div>

        <div aria-hidden className="-mx-3 h-px shrink-0 bg-default-200" />

        <div
          aria-label="Note body"
          className="min-h-0 flex-1 overflow-hidden rounded-b-[var(--modal-radius)]"
        >
          <CodeMirrorEditor
            initialContent={content}
            theme={theme === "dark" ? "dark" : "light"}
            useVim={vimMode}
            vimConfig={vimConfig}
            onChange={handleContentChange}
          />
        </div>
      </AppModal.Panel>
    </AppModal.Root>
  );
}
