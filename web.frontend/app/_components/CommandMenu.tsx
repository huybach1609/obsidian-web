"use client";

import type { FileIndexDto } from "@/types/FileIndexDto";
import type { Selection } from "@react-types/shared";

import { Input, ListBox } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppModal } from "@/app/_components/Modal/AppModal";
import { useFileSearch } from "@/hook/useFileSearch";
import { useAppSettings } from "@/contexts/AppContext";

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { setQuery, results } = useFileSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setInputValue("");
      setQuery("");
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
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      // If nothing selected, select first item
      if (!selectedKey) {
        setSelectedKey(results[0].filePath);
      } else {
        const currentIndex = results.findIndex(
          (f) => f.filePath === selectedKey,
        );
        const nextIndex = (currentIndex + 1) % results.length;

        setSelectedKey(results[nextIndex].filePath);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // If nothing selected, select last item
      if (!selectedKey) {
        setSelectedKey(results[results.length - 1].filePath);
      } else {
        const currentIndex = results.findIndex(
          (f) => f.filePath === selectedKey,
        );
        const prevIndex =
          currentIndex === 0 ? results.length - 1 : currentIndex - 1;

        setSelectedKey(results[prevIndex].filePath);
      }
    } else if (e.key === "Enter") {
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

  const { setLastVisitedPath } = useAppSettings();

  const handleSelect = (filePath: string) => {
    setOpen(false);
    const targetPath = `/notes/${filePath}`;

    setLastVisitedPath(targetPath);
    router.push(targetPath);
  };

  const handleClose = () => {
    setOpen(false);
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
    <AppModal.Root closeOnBackdropClick isOpen={open} onClose={handleClose}>
      <AppModal.Backdrop className="bg-background/50 backdrop-blur-[2px]" />
      <AppModal.Panel className="w-full max-w-2xl rounded-[1.75rem] border border-default-200 bg-background/90 shadow-2xl">
        <AppModal.Title>Command Palette</AppModal.Title>

        <div className="flex flex-col gap-1">
          <Input
            ref={inputRef}
            placeholder="Search notes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {results.length === 0 && inputValue && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No results found.
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2 bg-transparent">
            <div className="text-xs font-medium text-neutral-400 mb-2 px-2">
              FILES
            </div>
            <ListBox
              aria-label="File search results"
              className="max-h-[60vh] overflow-y-auto bg-transparent"
              selectedKeys={selectedKey ? new Set([selectedKey]) : new Set()}
              selectionMode="single"
              onSelectionChange={handleSelectionChange}
            >
              {results.map((file: FileIndexDto) => (
                <ListBox.Item
                  key={file.filePath}
                  className=" text-sm rounded-lg data-[hover=true]:bg-accent/10 data-[selected=true]:bg-accent/10 cursor-pointer transition-colors"
                  id={file.filePath}
                  textValue={`${file.fileName} ${file.filePath}`}
                >
                  <div className="flex flex-col  gap-2">
                    <div className="text-foreground font-medium ">
                      {file.fileName}
                    </div>
                    <div className="text-foreground/80 text-xs ">
                      {file.filePath}
                    </div>
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </div>
        )}
      </AppModal.Panel>
    </AppModal.Root>
  );
};
