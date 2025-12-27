'use client';

import { Button, Modal, ModalContent, ModalBody, Input, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { Save, X } from "lucide-react";

interface CreateFolderModalProps {
    isOpen: boolean;
    path: string;
    onSave: (folderName: string) => void; // Called when clicking Save button
    onCloseWithoutSave: () => void; // Called when clicking Close button
}

export default function CreateFolderModal({ isOpen, path, onSave, onCloseWithoutSave }: CreateFolderModalProps) {
    const [folderNameError, setFolderNameError] = useState<string>("");
    const [folderName, setFolderName] = useState<string>("");

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFolderName("");
            setFolderNameError("");
        }
    }, [isOpen]);

    // Validate folder name
    const validateFolderName = useCallback((name: string): boolean => {
        if (!name.trim()) {
            setFolderNameError("Folder name is required");
            return false;
        }

        const invalidChars = /[\\/:]/;
        if (invalidChars.test(name)) {
            setFolderNameError("Folder name cannot contain any of these characters: \\ / :");
            return false;
        }

        setFolderNameError("");
        return true;
    }, []);

    const handleFolderNameChange = useCallback((value: string) => {
        setFolderName(value);
        if (folderNameError) {
            validateFolderName(value);
        }
    }, [folderNameError, validateFolderName]);

    const handleSaveClick = () => {
        if (!validateFolderName(folderName)) {
            return;
        }
        onSave(folderName);
    };

    const handleCloseClick = () => {
        setFolderName("");
        setFolderNameError("");
        onCloseWithoutSave();
    };

    var parentsItem: string[] = (path || '/').split('/').filter(Boolean);
    return (
        <>
            <Modal isOpen={isOpen} size="xl" hideCloseButton isDismissable={false}>
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
                                            isDisabled={!folderName.trim() || !!folderNameError}
                                            isIconOnly
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>

                                        <Button variant="light" onPress={handleCloseClick} isIconOnly>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                </div>
                                {/* Folder name input - highlighted */}
                                <div className="px-6 pb-6 ">
                                    <Input
                                        placeholder="Untitled"
                                        aria-label="Folder name"
                                        value={folderName}
                                        onValueChange={handleFolderNameChange}
                                        isInvalid={!!folderNameError}
                                        errorMessage={folderNameError}
                                        variant="flat"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveClick();
                                            }
                                        }}
                                        classNames={{
                                            input: "text-lg font-semibold text-foreground",
                                            inputWrapper: folderNameError
                                                ? "bg-danger-100 dark:bg-danger-900/20"
                                                : "bg-warning-200 dark:bg-warning-900/30 hover:bg-warning-300 dark:hover:bg-warning-900/40",
                                            base: "w-full",
                                        }}
                                    />
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

