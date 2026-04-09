"use client";

import type { FileIndexDto } from "@/types/FileIndexDto";

import { memo, useEffect, useRef } from "react";

type CommandMenuResultsListProps = {
  results: FileIndexDto[];
  selectedKey: string | null;
  onSelect: (filePath: string) => void;
};

type CommandMenuResultItemProps = {
  file: FileIndexDto;
  selected: boolean;
  onSelect: (filePath: string) => void;
};

const CommandMenuResultItem = memo(
  ({ file, selected, onSelect }: CommandMenuResultItemProps) => (
    <li role="presentation">
      <button
        aria-selected={selected}
        className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/10"
        }`}
        data-file-path={file.filePath}
        id={file.filePath}
        role="option"
        type="button"
        onClick={() => onSelect(file.filePath)}
      >
        <div className="flex flex-col gap-1">
          <div className="font-medium text-foreground">{file.fileName}</div>
          <div className="text-xs text-foreground/80">{file.filePath}</div>
        </div>
      </button>
    </li>
  ),
);

CommandMenuResultItem.displayName = "CommandMenuResultItem";

export const CommandMenuResultsList = memo(
  ({ results, selectedKey, onSelect }: CommandMenuResultsListProps) => {
    const listRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
      if (!selectedKey || !listRef.current) return;

      const selectedElement = listRef.current.querySelector<HTMLButtonElement>(
        `[data-file-path="${CSS.escape(selectedKey)}"]`,
      );

      selectedElement?.scrollIntoView({ block: "nearest" });
    }, [selectedKey]);

    return (
      <ul
        ref={listRef}
        aria-label="File search results"
        className="max-h-[60vh] space-y-1 overflow-y-auto bg-transparent"
        role="listbox"
      >
        {results.map((file) => (
          <CommandMenuResultItem
            key={file.filePath}
            file={file}
            selected={selectedKey === file.filePath}
            onSelect={onSelect}
          />
        ))}
      </ul>
    );
  },
);

CommandMenuResultsList.displayName = "CommandMenuResultsList";
