"use client";

import type { FileIndexDto } from "@/types/FileIndexDto";
import type { VimConfig } from "@/types/vimConfig";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

import { defaultVimConfig } from "@/types/vimConfig";
import { useVimConfig } from "@/hook/useVimConfig";
import { clearVimConfigFromStorage } from "@/services/vimconfigservice";
import { useAuth } from "@/contexts/AuthContext";

export interface PageTitle {
  title: string;
  icon: React.ReactNode;
  description: string;
}

type EditorContextValue = {
  vimConfig: VimConfig;
  setVimConfig: (config: VimConfig) => Promise<void>;
  fileIndex: FileIndexDto[];
  pageTitle: PageTitle;
  setPageTitle: (pageTitle: PageTitle) => void;
  clearEditorSettings: () => void;
};

const defaultValue: EditorContextValue = {
  vimConfig: defaultVimConfig,
  setVimConfig: async () => {},
  fileIndex: [],
  pageTitle: {
    title: "",
    icon: null,
    description: "",
  },
  setPageTitle: (_pageTitle: PageTitle) => {},
  clearEditorSettings: () => {},
};

const EditorContext = createContext<EditorContextValue>(defaultValue);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuth();
  const { config: vimConfig, updateConfig: updateVimConfig } = useVimConfig();
  const [fileIndex, setFileIndexState] = useState<FileIndexDto[]>([]);
  const [pageTitle, setPageTitleState] = useState<PageTitle>({
    title: "",
    icon: null,
    description: "",
  });

  useEffect(() => {
    const fetchFileIndex = async () => {
      try {
        const response = await axios.get("/file-index");

        setFileIndexState(response.data);
      } catch {
        setFileIndexState([]);
      }
    };

    if (accessToken) {
      fetchFileIndex();
    } else {
      setFileIndexState([]);
    }
  }, [accessToken]);

  const clearEditorSettings = useCallback(() => {
    clearVimConfigFromStorage();
    setFileIndexState([]);
    setPageTitleState({
      title: "",
      icon: null,
      description: "",
    });
  }, []);

  const value = useMemo(
    () => ({
      vimConfig,
      setVimConfig: updateVimConfig,
      fileIndex,
      pageTitle,
      setPageTitle: setPageTitleState,
      clearEditorSettings,
    }),
    [clearEditorSettings, fileIndex, pageTitle, updateVimConfig, vimConfig],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
