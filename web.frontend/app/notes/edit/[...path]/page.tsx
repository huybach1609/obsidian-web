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
import { useAppSettings } from "@/contexts/AppContext";
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
  const { vimMode, vimConfig } = useAppSettings();
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

  // Fetch file content
  useEffect(() => {
    // Reset markdown to null when filePath changes to trigger exit animation
    setMarkdown(null);
    setHasChanges(false);
    // Set loading to true immediately when filePath changes
    setIsContentLoading(true);

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
    async (value?: string) => {
      const contentToSave = value || markdownRef.current;

      if (!contentToSave) return;

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="h-24 bg-transparent" />
      {markdown !== null ? (
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
