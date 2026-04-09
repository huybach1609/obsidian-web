"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import {
  UiPrefsProvider,
  getLastVisitedPathFromCookie,
  useUiPrefs,
} from "@/contexts/UiPrefsContext";

export const useAuthSettings = () => useAuth();
export const useUiPrefsSettings = () => useUiPrefs();
export const useEditorSettings = () => useEditor();
export { getTokenFromCookie } from "@/contexts/AuthContext";
export { getLastVisitedPathFromCookie };

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <EditorProvider>
        <UiPrefsProvider>{children}</UiPrefsProvider>
      </EditorProvider>
    </AuthProvider>
  );
};
