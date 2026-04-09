"use client";

import { Input } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppModal } from "@/app/_components/Modal/AppModal";
import { CommandMenuResultsList } from "@/app/_components/CommandMenuResultsList";
import { useFileSearch } from "@/hook/useFileSearch";
import { useUiPrefsSettings } from "@/contexts/AppContext";

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

  const { setLastVisitedPath } = useUiPrefsSettings();

  const handleSelect = useCallback(
    (filePath: string) => {
      setOpen(false);
      const targetPath = `/notes/${filePath}`;

      setLastVisitedPath(targetPath);
      router.push(targetPath);
    },
    [router, setLastVisitedPath],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!selectedKey) {
          setSelectedKey(results[0].filePath);

          return;
        }

        const currentIndex = results.findIndex(
          (f) => f.filePath === selectedKey,
        );
        const nextIndex = (currentIndex + 1) % results.length;

        setSelectedKey(results[nextIndex].filePath);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!selectedKey) {
          setSelectedKey(results[results.length - 1].filePath);

          return;
        }

        const currentIndex = results.findIndex(
          (f) => f.filePath === selectedKey,
        );
        const prevIndex =
          currentIndex === 0 ? results.length - 1 : currentIndex - 1;

        setSelectedKey(results[prevIndex].filePath);
      } else if (e.key === "Enter") {
        e.preventDefault();

        if (selectedKey) {
          handleSelect(selectedKey);
        } else {
          handleSelect(results[0].filePath);
        }
      }
    },
    [handleSelect, results, selectedKey],
  );

  const handleSelectionChange = useCallback(
    (key: string) => {
      setSelectedKey(key);
      handleSelect(key);
    },
    [handleSelect],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

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
            <CommandMenuResultsList
              results={results}
              selectedKey={selectedKey}
              onSelect={handleSelectionChange}
            />
          </div>
        )}
      </AppModal.Panel>
    </AppModal.Root>
  );
};
