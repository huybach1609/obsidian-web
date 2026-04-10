// app/notes/edit/[...path]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@heroui/react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import { getFile, updateFile } from "@/services/fileservice";
import { siteConfig } from "@/config/site";
import { decodePathParam } from "@/utils/stringhelper";
import { getVaultImageUrl, isVaultImagePath } from "@/lib/parseObsidian";
import { useEditorSettings, useUiPrefsSettings } from "@/contexts/AppContext";
import { useEditPage } from "@/contexts/EditPageContext";

// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(
  () => import("@/app/_components/CodeMirrorEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        Loading editor...
      </div>
    ),
  },
);

export default function EditPage() {
  const params = useParams();
  const filePath = decodePathParam(
    params.path as string | string[] | undefined,
  );
  const { theme } = useTheme();
  const { vimMode } = useUiPrefsSettings();
  const { vimConfig } = useEditorSettings();
  const {
    hasChanges,
    setHasChanges,
    setIsSaving,
    setOnSave,
    setIsContentLoading,
  } = useEditPage();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const markdownRef = useRef(markdown);
  const filePathRef = useRef(filePath);

  // Keep refs in sync
  useEffect(() => {
    markdownRef.current = markdown;
    filePathRef.current = filePath;
  }, [markdown, filePath]);

  // Update browser tab title based on fileName
  useEffect(() => {
    if (filePath) {
      const fileName = filePath.split("/").pop() || filePath;

      document.title = `${fileName} - ${siteConfig.name}`;
    } else {
      document.title = siteConfig.name;
    }

    return () => {
      document.title = siteConfig.name;
    };
  }, [filePath]);

  // Fetch file content (skip text load for binary images — GET /file reads as UTF-8 text)
  useEffect(() => {
    setMarkdown(null);
    setHasChanges(false);
    setIsContentLoading(true);

    if (!filePath) {
      setIsContentLoading(false);

      return;
    }

    if (isVaultImagePath(filePath)) {
      setIsContentLoading(false);

      return;
    }

    const loadFile = async () => {
      try {
        const response = await getFile(filePath);

        setMarkdown(response.content);
        setIsContentLoading(false);
      } catch (error) {
        console.error("Error loading file:", error);
        setIsContentLoading(false);
      }
    };

    loadFile();
  }, [filePath, setHasChanges, setIsContentLoading]);

  // Handle content change
  const handleChange = (value: string) => {
    setMarkdown(value);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = useCallback(
    async (value?: unknown) => {
      // CodeMirror passes the document string. HeroUI Button onPress passes a press event object.
      const contentToSave =
        typeof value === "string" ? value : markdownRef.current;

      if (contentToSave === null || contentToSave === undefined) return;

      if (isVaultImagePath(filePathRef.current)) return;

      setIsSaving(true);
      try {
        await updateFile(filePathRef.current, contentToSave);
        setHasChanges(false);
        toast("File saved successfully", {
          description: "The file has been saved successfully",
          variant: "success",
          timeout: 2000,
        });
      } catch (error) {
        console.error("Error saving file:", error);
        // Optional: Show error toast
      } finally {
        setIsSaving(false);
      }
    },
    [setIsSaving, setHasChanges],
  );

  // Register save handler with context
  useEffect(() => {
    setOnSave(() => handleSave);

    return () => setOnSave(null);
  }, [handleSave, setOnSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const imageSrc =
    filePath && isVaultImagePath(filePath) ? getVaultImageUrl(filePath) : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {imageSrc ? (
        <div className="flex justify-center px-4 pb-8">
          <img
            alt={filePath?.split("/").pop() || ""}
            className="max-w-full max-h-[calc(100vh-8rem)] w-auto object-contain rounded-md border border-default-200"
            src={imageSrc}
          />
        </div>
      ) : markdown !== null ? (
        <CodeMirrorEditor
          key={filePath}
          initialContent={markdown}
          theme={theme === "dark" ? "dark" : "light"}
          useVim={vimMode}
          vimConfig={vimConfig}
          onChange={handleChange}
          onSave={handleSave}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground">Loading...</p>
        </div>
      )}
    </div>
  );
}
