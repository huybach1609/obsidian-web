'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CreatePageContextType {
  hasChanges: boolean;
  setHasChanges: (value: boolean) => void;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  onSave: (() => void) | null;
  setOnSave: (handler: (() => void) | null) => void;
  isContentLoading: boolean;
  setIsContentLoading: (value: boolean) => void;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const CreatePageContext = createContext<CreatePageContextType | undefined>(undefined);

export function CreatePageProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onSave, setOnSave] = useState<(() => void) | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);

  return (
    <CreatePageContext.Provider
      value={{
        hasChanges,
        setHasChanges,
        isSaving,
        setIsSaving,
        onSave,
        setOnSave,
        isContentLoading,
        setIsContentLoading,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CreatePageContext.Provider>
  );
}

export function useCreatePage() {
  const context = useContext(CreatePageContext);
  if (context === undefined) {
    throw new Error('useCreatePage must be used within an CreatePageProvider');
  }
  return context;
}

