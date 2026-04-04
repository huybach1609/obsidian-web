"use client";

/**
 * Context cho mỗi hàng cây: loadingFolders và callbacks từ parent.
 * Giữ renderer node ổn định (ElementType) thay vì truyền handler qua props mỗi lần render.
 */

import type { TreeViewRowContextValue } from "./types";

import { createContext, useContext, type ReactNode } from "react";

const TreeViewRowContext = createContext<TreeViewRowContextValue | null>(null);

export function TreeViewRowProvider({
  value,
  children,
}: {
  value: TreeViewRowContextValue;
  children: ReactNode;
}) {
  return (
    <TreeViewRowContext.Provider value={value}>
      {children}
    </TreeViewRowContext.Provider>
  );
}

export function useTreeViewRow(): TreeViewRowContextValue {
  const ctx = useContext(TreeViewRowContext);

  if (!ctx) {
    throw new Error("useTreeViewRow must be used within TreeViewRowProvider");
  }

  return ctx;
}
