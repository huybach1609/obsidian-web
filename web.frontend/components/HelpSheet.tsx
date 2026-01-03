'use client';

import { Kbd } from "@heroui/react";

interface ShortcutItem {
    label: string;
    keys: string[];
}

const shortcuts: ShortcutItem[] = [
    { label: 'Open Command Menu', keys: ['Ctrl', 'K'] },
    { label: 'Toggle Sidebar', keys: ['Ctrl', '\\'] },
    { label: 'Save File', keys: ['Ctrl', 'S'] },
    { label: 'Close Modal', keys: ['Esc'] },
    { label: 'Navigate Down', keys: ['↓'] },
    { label: 'Navigate Up', keys: ['↑'] },
    { label: 'Select Item', keys: ['Enter'] },
];

export default function HelpSheet() {
    return (
        <div className="w-full max-w-lg mb-4 mt-8">
            <div className="space-y-0">
                {shortcuts.map((shortcut, index) => (
                    <div key={index}>
                        <div className="flex items-center justify-between py-3 px-0">
                            <span className="text-sm text-foreground/80 font-normal">
                                {shortcut.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {shortcut.keys.map((key, keyIndex) => (
                                    <span key={keyIndex} className="flex items-center">
                                        {keyIndex > 0 && (
                                            <span className="mx-1.5 text-foreground/40 text-xs font-medium">+</span>
                                        )}
                                        <Kbd className="bg-default-100 text-foreground/80 font-semibold text-xs min-w-[28px] justify-center">
                                            {key}
                                        </Kbd>
                                    </span>
                                ))}
                            </div>
                        </div>
                        {index < shortcuts.length - 1 && (
                            <div className="h-px bg-border" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
