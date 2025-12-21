'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface EditPageContextType {
  hasChanges: boolean;
  setHasChanges: (value: boolean) => void;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  onSave: (() => void) | null;
  setOnSave: (handler: (() => void) | null) => void;
  isContentLoading: boolean;
  setIsContentLoading: (value: boolean) => void;
}

const EditPageContext = createContext<EditPageContextType | undefined>(undefined);

export function EditPageProvider({ children }: { children: ReactNode }) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onSave, setOnSave] = useState<(() => void) | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);

  return (
    <EditPageContext.Provider
      value={{
        hasChanges,
        setHasChanges,
        isSaving,
        setIsSaving,
        onSave,
        setOnSave,
        isContentLoading,
        setIsContentLoading,
      }}
    >
      {children}
    </EditPageContext.Provider>
  );
}

export function useEditPage() {
  const context = useContext(EditPageContext);
  if (context === undefined) {
    throw new Error('useEditPage must be used within an EditPageProvider');
  }
  return context;
}

