// app/notes/edit/[...path]/page.tsx
'use client';
import { useParams, useRouter } from "next/navigation";
import { decodePathParam } from "@/utils/stringhelper";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import Header from "@/components/Header";
import { EyeIcon, SaveIcon, PencilOffIcon } from "lucide-react";
import { Button } from "@heroui/react";
import dynamic from "next/dynamic";
import { FileResponse, getFile} from "@/services/fileservice";
import { useTheme } from "next-themes";

// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(() => import('@/components/CodeMirrorEditor'), { 
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center">Loading editor...</div>
});

export default function EditPage() {
    const params = useParams();
    const filePath = decodePathParam(params.path as string | string[] | undefined);
    const router = useRouter();
    const { theme } = useTheme();
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    console.log('path', filePath);

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
        getFile(filePath).then((response: FileResponse) => {
            console.log('response', response);
            setMarkdown(response.content);
        });
    }, [filePath]);

    // Handle content change
    const handleChange = (value: string) => {
        setMarkdown(value);
        setHasChanges(true);
    };

    // Handle save
    const handleSave = async (value?: string) => {
        const contentToSave = value || markdown;
        if (!contentToSave) return;

        setIsSaving(true);
        try {
            // Replace with your actual save API call

            // await saveFile(filePath, contentToSave);
            setHasChanges(false);
            console.log('File saved successfully');
            // Optional: Show success toast
        } catch (error) {
            console.error('Error saving file:', error);
            // Optional: Show error toast
        } finally {
            setIsSaving(false);
        }
    };

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
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Header>
                <div className="flex items-center justify-between h-full w-full">
                    <div className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Edit</h3>
                        <span className="text-sm text-gray-500 truncate max-w-md">
                            {filePath}
                        </span>
                        {hasChanges && (
                            <span className="text-xs text-orange-500">• Unsaved changes</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="flat"
                            size="sm"
                            color={hasChanges ? "primary" : "default"}
                            onPress={() => handleSave()}
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
            
            <div className="flex-1 overflow-hidden">
                {markdown !== null ? (
                    <CodeMirrorEditor
                        key={filePath}
                        initialContent={markdown}
                        onChange={handleChange}
                        onSave={handleSave}
                        theme={theme === 'dark' ? 'dark' : 'light'}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-foreground">Loading...</p>
                    </div>
                )}
            </div>
        </div>
    );
}