// hooks/useFileSearch.ts
import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import type { FileIndexDto } from '@/types/FileIndexDto';
import { useAppSettings } from '@/contexts/AppContext';

export const useFileSearch = () => {
  const { fileIndex } = useAppSettings();

  const [query, setQuery] = useState('');

  // 1. Cấu hình Fuse.js dựa trên fileIndex từ AppContext
  const fuse = useMemo(() => {
    if (!fileIndex || fileIndex.length === 0) return null;
    return new Fuse<FileIndexDto>(fileIndex, {
      keys: ['fileName', 'filePath'], 
      threshold: 0.5, 
    });
  }, [fileIndex]);

  // 2. Thực hiện search
  const results = useMemo<FileIndexDto[]>(() => {
    if (!fuse) return [];
    if (!query.trim()) return [];

    return fuse.search(query).map((result) => result.item);
  }, [query, fuse]);

  return { query, setQuery, results, isLoading: !fileIndex || fileIndex.length === 0 };
};