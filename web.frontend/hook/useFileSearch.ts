// hooks/useFileSearch.ts
import type { FileIndexDto } from "@/types/FileIndexDto";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";

import { useEditorSettings } from "@/contexts/AppContext";

export const useFileSearch = () => {
  const { fileIndex } = useEditorSettings();

  const [query, setQuery] = useState("");

  // 1. Cấu hình Fuse.js dựa trên fileIndex từ AppContext
  const fuse = useMemo(() => {
    if (!fileIndex || fileIndex.length === 0) return null;

    return new Fuse<FileIndexDto>(fileIndex, {
      keys: ["fileName", "filePath"],
      threshold: 0.5,
    });
  }, [fileIndex]);

  // 3. Thực hiện search
  const results = useMemo<FileIndexDto[]>(() => {
    if (!fuse) return [];
    if (!query.trim()) return [];

    return fuse.search(query).map((result) => result.item);
  }, [query, fuse]);

  return {
    query,
    setQuery,
    results,
    isLoading: !fileIndex || fileIndex.length === 0,
  };
};
