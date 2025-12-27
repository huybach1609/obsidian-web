'use client';

import { Button, Modal, ModalFooter, ModalContent, ModalBody, Input, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAppSettings } from "@/contexts/AppContext";
import dynamic from "next/dynamic";
import { CrossIcon, Save, X } from "lucide-react";

// Dynamic import to avoid SSR issues
const CodeMirrorEditor = dynamic(() => import('@/components/CodeMirrorEditor'), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center">Loading editor...</div>
});

interface CreatePageModalProps {
    isOpen: boolean;
    path: string;
    onSave: (fileName: string, content: string) => void; // Called when clicking Action button or outside - should save
    onCloseWithoutSave: () => void; // Called when clicking Close button - should not save
}
export default function CreatePageModal({ isOpen, path, onSave, onCloseWithoutSave }: CreatePageModalProps) {
    const [fileNameError, setFileNameError] = useState<string>("");
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const { theme } = useTheme();
    const { vimMode } = useAppSettings();

    // Store initial content to compare changes
    const initialContentRef = useRef<string>("");
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            const emptyContent = "";
            setFileName("");
            setContent(emptyContent);
            initialContentRef.current = emptyContent;
            setFileNameError("");
            setHasChanges(false);
        } else {
            // Cleanup debounce timer when modal closes
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        }
    }, [isOpen, setHasChanges, setFileName, setContent]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Validate file name
    const validateFileName = useCallback((name: string): boolean => {
        if (!name.trim()) {
            setFileNameError("File name is required");
            return false;
        }

        const invalidChars = /[\\/:]/;
        if (invalidChars.test(name)) {
            setFileNameError("File name cannot contain any of these characters: \\ / :");
            return false;
        }

        setFileNameError("");
        return true;
    }, []);

    const handleFileNameChange = useCallback((value: string) => {
        setFileName(value);
        if (fileNameError) {
            validateFileName(value);
        }
    }, [fileNameError, setFileName, validateFileName]);

    // Optimized content change handler with debounce
    const handleContentChange = useCallback((value: string) => {
        // Update content immediately for editor responsiveness
        setContent(value);

        // Clear previous debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce hasChanges update (only update after user stops typing for 300ms)
        debounceTimerRef.current = setTimeout(() => {
            const hasActualChanges = value !== initialContentRef.current;
            setHasChanges(hasActualChanges);
        }, 300);
    }, [setContent, setHasChanges]);


    const handleSaveClick = () => {
        if (!validateFileName(fileName)) {
            return;
        }
        onSave(fileName, content);
    };

    const handleCloseClick = () => {
        setFileName("");
        setContent("");
        setFileNameError("");
        setHasChanges(false);
        onCloseWithoutSave();
    };


    var parentsItem: string[] = path.split('/');
    return (
        <>
            <Modal isOpen={isOpen} size="5xl" hideCloseButton isDismissable={false}>
                <ModalContent className="p-0">
                    {(onCloseModal) => (
                        <>
                            <ModalBody className="p-0 gap-0">
                                <div className="w-full relative flex justify-center items-center py-1 pt-2">
                                    <Breadcrumbs className="">
                                        {parentsItem.map((item: string, idx: number) => (
                                            <BreadcrumbItem key={idx}>
                                                {item}
                                            </BreadcrumbItem>
                                        ))}
                                    </Breadcrumbs>

                                    <div className="absolute right-0 flex gap-2">
                                        <Button
                                            variant="light"
                                            onPress={handleSaveClick}
                                            isDisabled={!fileName.trim() || !!fileNameError}
                                            isIconOnly
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>

                                        <Button variant="light" onPress={handleCloseClick} isIconOnly>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                </div>
                                {/* File name input - highlighted */}
                                <div className="px-4  pb-2">
                                    <Input
                                        placeholder="Untitled"
                                        aria-label="File name"
                                        value={fileName}
                                        onValueChange={handleFileNameChange}
                                        isInvalid={!!fileNameError}
                                        errorMessage={fileNameError}
                                        variant="flat"
                                        classNames={{
                                            input: "text-lg font-semibold text-foreground",
                                            inputWrapper: fileNameError
                                                ? "bg-danger-100 dark:bg-danger-900/20"
                                                : "bg-warning-200 dark:bg-warning-900/30 hover:bg-warning-300 dark:hover:bg-warning-900/40",
                                            base: "w-full",
                                        }}
                                    />
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-default-200" />

                                {/* Content editor - full height */}
                                <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                                    <CodeMirrorEditor
                                        initialContent={content}
                                        onChange={handleContentChange}
                                        theme={theme === 'dark' ? 'dark' : 'light'}
                                        useVim={vimMode}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-default-200">

                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}