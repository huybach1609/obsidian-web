"use client";

/**
 * State và logic tải cây: root + map children đã load, fetch depth=2, rename đồng bộ local.
 */

import type { TreeItem, TreeNode } from "./types";

import { useCallback, useEffect, useState } from "react";

import { getTree } from "@/services/fileservice";
import { buildRenamedPath, sortByTypeAndName } from "@/utils/stringhelper";

export function useTreeData(isAuthenticated: boolean, path: string) {
  const [rootItems, setRootItems] = useState<TreeItem[]>([]);
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[]>>(
    new Map(),
  );
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rootFetchResolved, setRootFetchResolved] = useState(false);

  const processNestedChildren = useCallback(
    (
      items: TreeItem[],
      parentPath: string,
      childrenMap: Map<string, TreeNode[]>,
    ) => {
      const children: TreeNode[] = items.map((item: TreeItem) => ({
        id: item.path,
        name: item.name,
        path: item.path,
        isDir: item.isDir,
        children: item.isDir ? [] : undefined,
      }));

      childrenMap.set(parentPath, children);

      items.forEach((item: TreeItem) => {
        if (item.isDir && item.children && item.children.length > 0) {
          processNestedChildren(item.children, item.path, childrenMap);
        }
      });
    },
    [],
  );

  const fetchTree = useCallback(
    async (folderPath: string, isRoot: boolean = false) => {
      if (!isAuthenticated) return;

      if (isRoot) {
        setLoading(true);
      } else {
        setLoadingFolders((prev) => new Set(prev).add(folderPath));
      }
      setError(null);

      try {
        const data = await getTree(folderPath, 2);

        const sortedData = sortByTypeAndName(data);

        const newChildrenMap = new Map<string, TreeNode[]>();

        if (isRoot) {
          setRootItems(sortedData);
          sortedData.forEach((item: TreeItem) => {
            if (item.isDir && item.children && item.children.length > 0) {
              processNestedChildren(item.children, item.path, newChildrenMap);
            }
          });
        } else {
          const children: TreeNode[] = sortedData.map((item: TreeItem) => ({
            id: item.path,
            name: item.name,
            path: item.path,
            isDir: item.isDir,
            children: item.isDir ? [] : undefined,
          }));

          newChildrenMap.set(folderPath, children);

          sortedData.forEach((item: TreeItem) => {
            if (item.isDir && item.children && item.children.length > 0) {
              processNestedChildren(item.children, item.path, newChildrenMap);
            }
          });
        }

        setLoadedChildren((prev) => {
          const next = new Map(prev);

          newChildrenMap.forEach((children, p) => {
            next.set(p, children);
          });

          return next;
        });
      } catch (err: unknown) {
        // eslint-disable-next-line no-console -- surfaced to UI via setError; log for diagnostics
        console.error("Error fetching tree:", err);

        const ax = err as {
          response?: { status?: number };
          message?: string;
        };

        if (ax.response?.status === 401 || ax.response?.status === 403) {
          setError("Authentication required. Please login.");
        } else if (ax.response?.status === 500) {
          setError("Server error. Please check if backend is running.");
        } else {
          setError(`Failed to load files: ${ax.message || "Unknown error"}`);
        }
      } finally {
        if (isRoot) {
          setLoading(false);
          setRootFetchResolved(true);
        } else {
          setLoadingFolders((prev) => {
            const next = new Set(prev);

            next.delete(folderPath);

            return next;
          });
        }
      }
    },
    [isAuthenticated, processNestedChildren],
  );

  const renameNodeInState = useCallback((oldPath: string, newName: string) => {
    const newPath = buildRenamedPath(oldPath, newName);

    setRootItems((prev) =>
      prev.map((item) =>
        item.path === oldPath
          ? {
              ...item,
              name: newName,
              path: newPath,
            }
          : item,
      ),
    );

    setLoadedChildren((prev) => {
      const next = new Map(prev);

      next.forEach((children, folderPath) => {
        const updatedChildren = children.map((child) =>
          child.path === oldPath
            ? {
                ...child,
                name: newName,
                path: newPath,
              }
            : child,
        );

        next.set(folderPath, updatedChildren);
      });

      return next;
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTree(path, true);
    } else {
      setRootItems([]);
      setError(null);
      setLoadedChildren(new Map());
      setLoadingFolders(new Set());
      setRootFetchResolved(false);
    }
  }, [path, isAuthenticated, fetchTree]);

  return {
    rootItems,
    loadedChildren,
    loadingFolders,
    error,
    loading,
    rootFetchResolved,
    fetchTree,
    renameNodeInState,
    setError,
  };
}
