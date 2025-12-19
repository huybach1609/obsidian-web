// app/notes/edit/[...path]/page.tsx
'use client';
import { useParams, useRouter } from "next/navigation";
import { decodePathParam } from "@/utils/stringhelper";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import Header from "@/components/Header";
import { EyeIcon, SaveIcon, PencilOffIcon, PencilIcon } from "lucide-react";
import { addToast, Button, cn } from "@heroui/react";
import dynamic from "next/dynamic";
import { FileResponse, getFile, updateFile } from "@/services/fileservice";
import { useTheme } from "next-themes";
import { useAppSettings } from "@/contexts/AppContext";
import { twMerge } from "tailwind-merge";


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
    const { vimMode, setVimMode } = useAppSettings();
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


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

            await updateFile(filePath, contentToSave);
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
        <div className="h-screen  overflow-hidden relative">
            <Header className=" top-0 z-10 absolute w-full bg-background/50 backdrop-blur-sm">
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
                        {/* {hasChanges && (
                            <span className="text-xs text-orange-500">• Unsaved changes</span>
                        )}
 */}
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


            <div className="flex-1 h-screen overflow-y-auto">
                <div className="h-24 bg-transparent "></div>
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
        </div>
    );
}