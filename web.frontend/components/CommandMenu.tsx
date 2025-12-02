"use client";

import { Modal, ModalContent } from "@heroui/react";
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";

// components/CommandMenu.tsx
import { useFileSearch } from '@/hook/useFileSearch';
import { useRouter } from 'next/navigation';
import type { FileIndexDto } from '@/types/FileIndexDto';

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);

    const { query, setQuery, results } = useFileSearch();
    const router = useRouter();

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

    return (
        <Modal isOpen={open} onOpenChange={setOpen} size="lg" backdrop="blur">
            <ModalContent className="p-0 bg-neutral-900 text-white rounded-xl overflow-hidden">

                {/* Accessible title để tránh warning */}
                <VisuallyHidden>
                    <h2>Command Palette</h2>
                </VisuallyHidden>

                {/* CMDK */}
                <Command 
                    className="w-full max-h-[70vh] px-3 py-4 outline-none"
                    shouldFilter={false} // Tắt filtering của CMDK vì đã dùng Fuse.js
                >
                    <Command.Input
                        placeholder="Search notes..."
                        className="w-full px-4 py-2 rounded-md bg-neutral-800 border border-neutral-700"
                        value={query}
                        onValueChange={setQuery}
                    />

                    <Command.List className="mt-3 max-h-[50vh] overflow-y-auto">
                        <Command.Empty className="px-2 py-3 text-sm opacity-50">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Files">
                            {results.map((file: FileIndexDto) => (
                                <Command.Item
                                    key={file.filePath}
                                    value={`${file.fileName} ${file.filePath}`} // CMDK cần value để hoạt động
                                    onSelect={() => {
                                        setOpen(false);
                                        router.push(`/notes/${file.filePath}`);
                                    }}>
                                    {file.fileName}
                                    <span style={{ opacity: 0.5, fontSize: '0.8em', marginLeft: 10 }}>
                                        {file.filePath}
                                    </span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>
                </Command>

            </ModalContent>
        </Modal>

        // <Command.Dialog open={open} onOpenChange={setOpen} label="Search Files">


        //   <Command.Input
        //     value={query}
        //     onValueChange={setQuery}
        //     placeholder="Search notes..."
        //   />

        //   <Command.List>
        //     <Command.Empty>No results found.</Command.Empty>

        //     {results.map((file: FileIndexDto) => (
        //       <Command.Item
        //         key={file.FilePath}
        //         onSelect={() => {
        //           setOpen(false);
        //           router.push(`/notes/${file.FilePath}`);
        //         }}
        //       >
        //         {file.FileName}
        //         <span
        //           style={{ opacity: 0.5, fontSize: '0.8em', marginLeft: 10 }}
        //         >
        //           {file.FilePath}
        //         </span>
        //       </Command.Item>
        //     ))}
        //   </Command.List>
        // </Command.Dialog>
    );
};