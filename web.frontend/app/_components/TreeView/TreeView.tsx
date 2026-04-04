"use client";

/**
 * Cây file sidebar: react-arborist, lazy-load thư mục, DnD move, mở đường dẫn theo selectedPath.
 * Cung cấp imperative API (refresh, expand/collapse) qua ref.
 */

import type { NodeApi, TreeApi, MoveHandler } from "react-arborist";
import type { TreeNode, TreeViewProps, TreeViewRef } from "./types";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
} from "react";
import { Tree } from "react-arborist";

import { TreeViewRowProvider } from "./TreeViewRowContext";
import { TreeViewRow } from "./TreeViewNode";
import { useContainerHeight } from "./useContainerHeight";
import { useTreeData } from "./useTreeData";

import { getParentPaths } from "@/utils/stringhelper";
import { moveFile } from "@/services/fileservice";
import { TreeViewSkeleton } from "@/app/_components/TreeViewSkeleton";

const TreeView = forwardRef<TreeViewRef, TreeViewProps>(
  (
    {
      path = "/",
      selectedPath,
      onSelect,
      onCreateFile,
      onCreateFolder,
      onCopyLink,
      onRename,
      onRemoveFile,
      onOpenCreatePage,
      isAuthenticated,
    },
    ref,
  ) => {
    const treeRef = useRef<TreeApi<TreeNode>>(null);
    const { containerRef, containerHeight } = useContainerHeight();

    const {
      rootItems,
      loadedChildren,
      loadingFolders,
      error,
      loading,
      rootFetchResolved,
      fetchTree,
      renameNodeInState,
      setError,
    } = useTreeData(isAuthenticated, path);

    const getNodeDepth = useCallback((node: NodeApi<TreeNode>): number => {
      let depth = 0;
      let current = node.parent;

      while (current) {
        depth++;
        current = current.parent;
      }

      return depth;
    }, []);

    const ensureFolderLoaded = useCallback(
      async (node: NodeApi<TreeNode>) => {
        if (!node.isInternal) return;

        const folderPath = node.data.path;
        const hasChildrenLoaded = loadedChildren.has(folderPath);
        const isCurrentlyLoading = loadingFolders.has(folderPath);

        if (!hasChildrenLoaded && !isCurrentlyLoading) {
          await fetchTree(folderPath, false);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      },
      [loadedChildren, loadingFolders, fetchTree],
    );

    useImperativeHandle(
      ref,
      () => ({
        refreshPath: (folderPath: string) => {
          if (folderPath === "/" || folderPath === path) {
            fetchTree(path, true);
          } else {
            fetchTree(folderPath, false);
          }
        },
        expandAll: async () => {
          const tree = treeRef.current;

          if (!tree) return;

          let hasMore = true;
          let iterations = 0;
          const maxIterations = 10;

          while (hasMore && iterations < maxIterations) {
            hasMore = false;
            const allNodes = tree.visibleNodes;

            for (const node of allNodes) {
              if (node.isInternal) {
                await ensureFolderLoaded(node);
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 50));

            const updatedNodes = tree.visibleNodes;

            for (const node of updatedNodes) {
              if (node.isInternal && !node.isOpen) {
                node.open();
                hasMore = true;
              }
            }

            iterations++;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        },
        collapseAll: () => {
          const tree = treeRef.current;

          if (!tree) return;

          const allNodes = tree.visibleNodes;
          const folders = allNodes.filter(
            (node) => node.isInternal && node.isOpen,
          );

          for (let i = folders.length - 1; i >= 0; i--) {
            folders[i].close();
          }
        },
        expandToLevel: async (level: number) => {
          const tree = treeRef.current;

          if (!tree) return;

          const allNodes = tree.visibleNodes;
          const foldersToClose = allNodes.filter(
            (node) => node.isInternal && node.isOpen,
          );

          for (let i = foldersToClose.length - 1; i >= 0; i--) {
            foldersToClose[i].close();
          }

          await new Promise((resolve) => setTimeout(resolve, 50));

          let currentLevel = 0;

          while (currentLevel < level) {
            const currentNodes = tree.visibleNodes;

            for (const node of currentNodes) {
              if (node.isInternal) {
                const depth = getNodeDepth(node);

                if (depth === currentLevel) {
                  await ensureFolderLoaded(node);
                }
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 50));

            const updatedNodes = tree.visibleNodes;

            for (const node of updatedNodes) {
              if (node.isInternal) {
                const depth = getNodeDepth(node);

                if (depth === currentLevel && !node.isOpen) {
                  node.open();
                }
              }
            }

            currentLevel++;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        },
        hasOpenFolders: () => {
          const tree = treeRef.current;

          if (!tree) return false;

          const allNodes = tree.visibleNodes;

          return allNodes.some((node) => node.isInternal && node.isOpen);
        },
      }),
      [fetchTree, path, getNodeDepth, ensureFolderLoaded],
    );

    const treeData = useMemo(() => {
      const rootNodes: TreeNode[] = rootItems.map((item) => ({
        id: item.path,
        name: item.name,
        path: item.path,
        isDir: item.isDir,
        children: item.isDir ? loadedChildren.get(item.path) || [] : undefined,
      }));

      const populateChildren = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) => {
          if (
            node.isDir &&
            Array.isArray(node.children) &&
            loadedChildren.has(node.path)
          ) {
            return {
              ...node,
              children: populateChildren(loadedChildren.get(node.path)!),
            };
          }
          if (node.isDir && !Array.isArray(node.children)) {
            return {
              ...node,
              children: [],
            };
          }

          return node;
        });

      return populateChildren(rootNodes);
    }, [rootItems, loadedChildren]);

    const showTreeSkeleton =
      !error && (!rootFetchResolved || (loading && rootItems.length === 0));
    const showEmptyState =
      rootFetchResolved && !loading && !error && treeData.length === 0;
    const hasRootContent = rootItems.length > 0;

    const handleToggle = useCallback(
      (id: string) => {
        const tree = treeRef.current;

        if (!tree) return;

        const node = tree.get(id);

        if (!node?.isInternal || !node.isOpen) return;

        const folderPath = node.data.path;
        const hasChildrenLoaded = loadedChildren.has(folderPath);
        const isCurrentlyLoading = loadingFolders.has(folderPath);

        if (!hasChildrenLoaded && !isCurrentlyLoading) {
          fetchTree(folderPath, false);
        }
      },
      [loadedChildren, loadingFolders, fetchTree],
    );

    const handleActivate = useCallback(
      (node: NodeApi<TreeNode>) => {
        if (!node.isInternal) {
          onSelect(node.data.path);
        }
      },
      [onSelect],
    );

    const handleRenameInTree = useCallback(
      (oldPath: string, newName: string) => {
        onRename?.(oldPath, newName);
        renameNodeInState(oldPath, newName);
      },
      [onRename, renameNodeInState],
    );

    const handleMove = useCallback<MoveHandler<TreeNode>>(
      async ({ dragIds, parentId, dragNodes, parentNode }) => {
        let sourcePath: string;

        if (dragNodes.length > 0 && dragNodes[0]) {
          sourcePath = dragNodes[0].data.path;
        } else {
          sourcePath = dragIds[0];
        }

        let destinationParentPath: string;

        if (parentNode) {
          destinationParentPath = parentNode.data.path;
        } else if (parentId) {
          const tree = treeRef.current;

          if (tree) {
            const destNode = tree.get(parentId);

            destinationParentPath = destNode ? destNode.data.path : parentId;
          } else {
            destinationParentPath = parentId;
          }
        } else {
          destinationParentPath = "/";
        }

        const tree = treeRef.current;

        if (tree && dragNodes[0] && dragNodes[0].data.isDir) {
          const sourceNormalized = sourcePath.replace(/\/$/, "");
          const destNormalized = destinationParentPath.replace(/\/$/, "");

          if (
            destNormalized.startsWith(sourceNormalized + "/") ||
            destNormalized === sourceNormalized
          ) {
            setError("Cannot move a folder into itself or its subdirectories");

            return;
          }
        }

        try {
          await moveFile({
            sourcePath,
            destinationParentPath,
            newName: "",
          });

          const sourceParentPath =
            sourcePath.substring(0, sourcePath.lastIndexOf("/")) || "/";

          if (sourceParentPath !== destinationParentPath) {
            await fetchTree(sourceParentPath, sourceParentPath === path);
          }

          await fetchTree(
            destinationParentPath,
            destinationParentPath === path,
          );

          if (sourceParentPath === path || destinationParentPath === path) {
            await fetchTree(path, true);
          }
        } catch (err: unknown) {
          // eslint-disable-next-line no-console -- user sees setError; log for diagnostics
          console.error("Error moving file/folder:", err);
          const ax = err as {
            response?: { data?: { error?: string } };
            message?: string;
          };
          const errorMessage =
            ax.response?.data?.error ||
            ax.message ||
            "Failed to move file/folder";

          setError(errorMessage);

          await fetchTree(path, true);
        }
      },
      [fetchTree, path, setError],
    );

    const parentPathsForSelection = useMemo(
      () => (selectedPath ? getParentPaths(selectedPath) : []),
      [selectedPath],
    );

    useEffect(() => {
      if (
        !selectedPath ||
        !isAuthenticated ||
        !treeRef.current ||
        !hasRootContent
      ) {
        return;
      }

      const openPathToNode = async () => {
        const tree = treeRef.current;

        if (!tree) return;

        if (parentPathsForSelection.length === 0) return;

        for (const folderPath of parentPathsForSelection) {
          if (folderPath === selectedPath) continue;

          const hasChildrenLoaded = loadedChildren.has(folderPath);
          const isCurrentlyLoading = loadingFolders.has(folderPath);

          if (!hasChildrenLoaded && !isCurrentlyLoading) {
            await fetchTree(folderPath, false);
          }

          await new Promise((resolve) => setTimeout(resolve, 50));

          const node = tree.get(folderPath.replace(/^\//, ""));

          if (node?.isInternal && !node.isOpen) {
            node.open();
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        const targetNode = tree.get(selectedPath);

        if (targetNode) {
          targetNode.select();
          targetNode.focus();
        }
      };

      const timeoutId = setTimeout(openPathToNode, 100);

      return () => clearTimeout(timeoutId);
    }, [
      selectedPath,
      isAuthenticated,
      hasRootContent,
      parentPathsForSelection,
      loadedChildren,
      loadingFolders,
      fetchTree,
    ]);

    const rowContextValue = useMemo(
      () => ({
        loadingFolders,
        onCreateFile,
        onCreateFolder,
        onCopyLink,
        onRename: handleRenameInTree,
        onRemoveFile,
        onSelect,
        onOpenCreatePage,
      }),
      [
        loadingFolders,
        onCreateFile,
        onCreateFolder,
        onCopyLink,
        handleRenameInTree,
        onRemoveFile,
        onSelect,
        onOpenCreatePage,
      ],
    );

    if (!isAuthenticated) {
      return (
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-3">Files</h4>
          <p className="text-foreground text-sm">Please login to view files</p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col p-2 bg-background text-foreground">
        {showTreeSkeleton && <TreeViewSkeleton />}

        {error && (
          <p className="text-error text-sm mb-3 bg-error/10 p-2 rounded border border-error/20">
            {error}
          </p>
        )}

        {showEmptyState && (
          <p className="text-foreground text-sm">No files found</p>
        )}

        {treeData.length > 0 && (
          <div ref={containerRef} className="flex-1 min-h-0">
            <TreeViewRowProvider value={rowContextValue}>
              <Tree
                ref={treeRef}
                data={treeData}
                height={containerHeight}
                indent={20}
                openByDefault={false}
                rowHeight={28}
                width="100%"
                onActivate={handleActivate}
                onMove={handleMove}
                onToggle={handleToggle}
              >
                {TreeViewRow}
              </Tree>
            </TreeViewRowProvider>
          </div>
        )}
      </div>
    );
  },
);

TreeView.displayName = "TreeView";

export default TreeView;
