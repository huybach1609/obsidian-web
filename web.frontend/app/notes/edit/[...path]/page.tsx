// app/notes/edit/[...path]/page.tsx
'use client';
import { useParams } from "next/navigation";
import { decodePathParam } from "@/utils/stringhelper";
import { useEffect, useState, useCallback, useRef } from "react";
import { siteConfig } from "@/config/site";
import { addToast, cn } from "@heroui/react";
import dynamic from "next/dynamic";
import { FileResponse, getFile, updateFile } from "@/services/fileservice";
import { useTheme } from "next-themes";
import { useAppSettings } from "@/contexts/AppContext";
import { useEditPage } from "@/contexts/EditPageContext";


// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(() => import('@/components/CodeMirrorEditor'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center">Loading editor...</div>
});

export default function EditPage() {
    const params = useParams();
    const filePath = decodePathParam(params.path as string | string[] | undefined);
    const { theme } = useTheme();
    const { vimMode } = useAppSettings();
    const { hasChanges, setHasChanges, setIsSaving, setOnSave, setIsContentLoading } = useEditPage();
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
            const fileName = filePath.split('/').pop() || filePath;
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
                console.error('Error loading file:', error);
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
    const handleSave = useCallback(async (value?: string) => {
        const contentToSave = value || markdownRef.current;
        if (!contentToSave) return;

        setIsSaving(true);
        try {
            await updateFile(filePathRef.current, contentToSave);
            setHasChanges(false);
            addToast({
                title: 'File saved successfully',
                description: 'The file has been saved successfully',
                color: 'success',
                hideIcon: false,
                timeout: 2000,
                classNames: {
                    base: cn([
                        "bg-background/50 text-foreground",
                        "backdrop-blur-sm",
                    ]),
                    closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
            });
        } catch (error) {
            console.error('Error saving file:', error);
            // Optional: Show error toast
        } finally {
            setIsSaving(false);
        }
    }, [setIsSaving, setHasChanges]);

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
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="h-24 bg-transparent"></div>
            {markdown !== null ? (
                <CodeMirrorEditor
                    key={filePath}
                    initialContent={markdown}
                    onChange={handleChange}
                    onSave={handleSave}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    useVim={vimMode}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-foreground">Loading...</p>
                </div>
            )}
        </div>
    );
}