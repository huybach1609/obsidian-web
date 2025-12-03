"use client";

import { Modal, ModalContent, ModalHeader, Input, Listbox, ListboxItem, Kbd } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useFileSearch } from '@/hook/useFileSearch';
import { useRouter } from 'next/navigation';
import type { FileIndexDto } from '@/types/FileIndexDto';
import type { Selection } from "@react-types/shared";
import { SearchIcon } from "lucide-react";

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const { query, setQuery, results } = useFileSearch();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setInputValue('');
            setQuery('');
            setSelectedKey(null);
        }
    }, [open, setQuery]);

    // Debounce input value to query with 200ms delay
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setQuery(inputValue);
        }, 200);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [inputValue, setQuery]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            return;
        }

        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // If nothing selected, select first item
            if (!selectedKey) {
                setSelectedKey(results[0].filePath);
            } else {
                const currentIndex = results.findIndex(f => f.filePath === selectedKey);
                const nextIndex = (currentIndex + 1) % results.length;
                setSelectedKey(results[nextIndex].filePath);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // If nothing selected, select last item
            if (!selectedKey) {
                setSelectedKey(results[results.length - 1].filePath);
            } else {
                const currentIndex = results.findIndex(f => f.filePath === selectedKey);
                const prevIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
                setSelectedKey(results[prevIndex].filePath);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // If item is selected, navigate to it
            if (selectedKey) {
                handleSelect(selectedKey);
            }
            // If no item selected but results exist, select first item
            else if (results.length > 0) {
                handleSelect(results[0].filePath);
            }
        }
    };

    const handleSelect = (filePath: string) => {
        setOpen(false);
        router.push(`/notes/${filePath}`);
    };

    const handleSelectionChange = (keys: Selection) => {
        if (keys === "all") return;
        const key = Array.from(keys)[0] as string;
        if (key) {
            setSelectedKey(key);
            handleSelect(key);
        }
    };
    return (
        <Modal
            isOpen={open}
            onOpenChange={setOpen}
            size="xl"
            backdrop="blur"
            hideCloseButton
            classNames={{

                base: "bg-transparent p-0 m-0",
                backdrop: "bg-transparent"
            }}
        >
            <ModalContent className="bg-background text-foreground p-0 m-0">
                <VisuallyHidden>
                    <h2>Command Palette</h2>
                </VisuallyHidden>

                <ModalHeader className="flex flex-col gap-1 p-0 m-0">
                    <Input
                        ref={inputRef}
                        placeholder="Search notes..."
                        value={inputValue}
                        onValueChange={setInputValue}
                        onKeyDown={handleKeyDown}
                        classNames={{
                            base: "w-full bg-transparent border-transparent hover:bg-transparent",
                            // inputWrapper: "bg-transparent border-transparent hover:bg-transparent focus-within:bg-transparent data-[focus=true]:bg-transparent shadow-none focus:shadow-none focus-visible:shadow-none",
                            input: "focus:outline-none focus-visible:outline-none",
                            inputWrapper: [
                                "shadow-xl",
                                "bg-default-200/50",
                                "dark:bg-default/60",
                                "backdrop-blur-xl",
                                "backdrop-saturate-200",
                              ]
                        }}
                        startContent={
                            <SearchIcon className="mx-1" size={16} />
                        }
                        endContent={
                            <Kbd className="" keys={["escape"]}>
                              Esc  
                            </Kbd>
                        }
                        size="lg"
                        autoFocus
                    />
                </ModalHeader>

                    {results.length === 0 && inputValue && (
                        <div className="text-center py-8 text-neutral-500 text-sm">
                            No results found.
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="mx-4 mt-2">
                            <div className="text-xs font-semibold text-neutral-400 mb-2 px-2">
                                FILES
                            </div>
                            <Listbox
                                aria-label="File search results"
                                selectedKeys={selectedKey ? [selectedKey] : []}
                                onSelectionChange={handleSelectionChange}
                                selectionMode="single"
                                classNames={{
                                    base: "max-h-[60vh] overflow-y-auto",
                                    list: "gap-1"
                                }}
                            >
                                {results.map((file: FileIndexDto) => (
                                    <ListboxItem
                                        key={file.filePath}
                                        textValue={`${file.fileName} ${file.filePath}`}
                                        classNames={{
                                            base: [
                                                "px-3 py-1 text-sm rounded-lg",
                                                "data-[hover=true]:bg-primary/10",
                                                "data-[selected=true]:bg-primary/10",
                                                "cursor-pointer transition-colors"
                                            ],
                                            title: "text-foreground font-medium",
                                            description: "text-foreground/80 text-xs"
                                        }}
                                        description={file.filePath}
                                    >
                                        {file.fileName}
                                    </ListboxItem>
                                ))}
                            </Listbox>
                        </div>
                    )}
            </ModalContent>
        </Modal>
    );
};