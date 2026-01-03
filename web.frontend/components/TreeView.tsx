'use client';

import { useEffect, useState, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Tree } from 'react-arborist';
import type { NodeApi, TreeApi } from 'react-arborist';
import { getTree, moveFile } from '@/services/fileservice';
import { buildRenamedPath, extractFileName, getParentPaths, sortByTypeAndName } from '@/utils/stringhelper';
import { ChevronDownIcon, ChevronRightIcon, Ellipsis, FileIcon, FolderIcon, Plus } from 'lucide-react';
import { DropdownTrigger, DropdownMenu, Dropdown, Spinner, DropdownItem } from '@heroui/react';

// region Type Definitions
interface TreeItem {
  path: string;
  name: string;
  isDir: boolean;
  children?: TreeItem[];
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
}

interface TreeViewProps {
  path?: string;
  selectedPath?: string;
  onSelect: (path: string) => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onCopyLink?: (path: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onRemoveFile?: (path: string) => void;
  onOpenCreatePage: (path: string) => void;
  isAuthenticated: boolean;
}

export interface TreeViewRef {
  refreshPath: (folderPath: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandToLevel: (level: number) => void;
  hasOpenFolders: () => boolean;
}

interface NodeComponentProps {
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
  dragHandle?: any;
  loadingFolders?: Set<string>;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onCopyLink?: (path: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onRemoveFile?: (path: string) => void;
  onSelect?: (path: string) => void;
  onOpenCreatePage?: (path: string) => void;
}
// #region Custom Hooks
const useContainerHeight = (dependencies: any[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateHeight = () => {
      // Calculate height based on the container's actual available space
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setContainerHeight(height);
      } else {
        // Fallback to window height if container not available yet
        setContainerHeight(window.innerHeight - 100);
      }
    };

    const updateHeight = () => {
      requestAnimationFrame(calculateHeight);
    };

    const timeoutId = setTimeout(updateHeight, 0);
    const rafId = requestAnimationFrame(updateHeight);

    window.addEventListener('resize', updateHeight);

    const resizeObserver = new ResizeObserver(updateHeight);
    const parentElement = containerRef.current?.parentElement;

    if (parentElement) resizeObserver.observe(parentElement);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, dependencies);

  return { containerRef, containerHeight };
};

const useTreeData = (isAuthenticated: boolean, path: string) => {
  const [rootItems, setRootItems] = useState<TreeItem[]>([]);
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to recursively process nested children and collect them into a map
  const processNestedChildren = useCallback((items: TreeItem[], parentPath: string, childrenMap: Map<string, TreeNode[]>) => {
    const children: TreeNode[] = items.map((item: TreeItem) => ({
      id: item.path,
      name: item.name,
      path: item.path,
      isDir: item.isDir,
      // Folders must always have children array (even if empty) for react-arborist to treat them as folders
      children: item.isDir ? [] : undefined,
    }));

    // Add children to the map
    childrenMap.set(parentPath, children);

    // Recursively process nested children
    items.forEach((item: TreeItem) => {
      if (item.isDir && item.children && item.children.length > 0) {
        processNestedChildren(item.children, item.path, childrenMap);
      }
    });
  }, []);

  const fetchTree = useCallback(async (folderPath: string, isRoot: boolean = false) => {
    if (!isAuthenticated) return;

    if (isRoot) {
      setLoading(true);
    } else {
      setLoadingFolders(prev => new Set(prev).add(folderPath));
    }
    setError(null);

    try {
      // Request depth=2 to get 2 levels of tree for better loading
      const data = await getTree(folderPath, 2);

      const sortedData = sortByTypeAndName(data);

      // Collect all nested children into a map first
      const newChildrenMap = new Map<string, TreeNode[]>();

      if (isRoot) {
        setRootItems(sortedData);
        // Process nested children for root items
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
          // Folders must always have children array (even if empty) for react-arborist to treat them as folders
          children: item.isDir ? [] : undefined,
        }));

        newChildrenMap.set(folderPath, children);

        // Process nested children
        sortedData.forEach((item: TreeItem) => {
          if (item.isDir && item.children && item.children.length > 0) {
            processNestedChildren(item.children, item.path, newChildrenMap);
          }
        });
      }

      // Update loadedChildren state once with all collected children
      setLoadedChildren(prev => {
        const next = new Map(prev);
        newChildrenMap.forEach((children, path) => {
          next.set(path, children);
        });
        return next;
      });
    } catch (err: any) {
      console.error('Error fetching tree:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required. Please login.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please check if backend is running.');
      } else {
        setError(`Failed to load files: ${err.message || 'Unknown error'}`);
      }
    } finally {
      if (isRoot) {
        setLoading(false);
      } else {
        setLoadingFolders(prev => {
          const next = new Set(prev);
          next.delete(folderPath);
          return next;
        });
      }
    }
  }, [isAuthenticated, processNestedChildren]);

  // Update the tree data in the state when a node is renamed
  const renameNodeInState = useCallback((oldPath: string, newName: string) => {
    const newPath = buildRenamedPath(oldPath, newName);
    // Update root items
    setRootItems(prev =>
      prev.map(item =>
        item.path === oldPath
          ? {
            ...item,
            name: newName,
            path: newPath,
          }
          : item
      )
    );

    // Update any loaded children entries that match this path
    setLoadedChildren(prev => {
      const next = new Map(prev);

      next.forEach((children, folderPath) => {
        const updatedChildren = children.map(child =>
          child.path === oldPath
            ? {
              ...child,
              name: newName,
              path: newPath,
            }
            : child
        );
        next.set(folderPath, updatedChildren);
      });
      return next;
    });
  }, []);

  // Update the tree data in the state when a node is moved
  const moveNodeInState = useCallback((sourcePath: string, destinationPath: string) => {
    console.log('moveNodeInState', sourcePath, destinationPath);
    // // Helper to find and remove node from a tree structure
    // const removeNode = (items: TreeItem[], path: string): { found: TreeItem | null; remaining: TreeItem[] } => {
    //   for (let i = 0; i < items.length; i++) {
    //     if (items[i].path === path) {
    //       const found = items[i];
    //       const remaining = [...items.slice(0, i), ...items.slice(i + 1)];
    //       return { found, remaining };
    //     }
    //     if (items[i].isDir && items[i].children) {
    //       const result = removeNode(items[i].children!, path);
    //       if (result.found) {
    //         return {
    //           found: result.found,
    //           remaining: items.map((item, idx) =>
    //             idx === i ? { ...item, children: result.remaining } : item
    //           ),
    //         };
    //       }
    //     }
    //   }
    //   return { found: null, remaining: items };
    // };

    // // Find the node first
    // let foundNode: TreeItem | null = null;

    // // Check root items
    // for (const item of rootItems) {
    //   if (item.path === sourcePath) {
    //     foundNode = item;
    //     break;
    //   }
    //   if (item.isDir && item.children) {
    //     const result = removeNode(item.children, sourcePath);
    //     if (result.found) {
    //       foundNode = result.found;
    //       // Update the parent's children
    //       setRootItems(prev =>
    //         prev.map(rootItem =>
    //           rootItem.path === item.path
    //             ? { ...rootItem, children: result.remaining }
    //             : rootItem
    //         )
    //       );
    //       break;
    //     }
    //   }
    // }

    // // Check loaded children if not found in root
    // if (!foundNode) {
    //   setLoadedChildren(prev => {
    //     const next = new Map(prev);
    //     next.forEach((children, folderPath) => {
    //       const result = removeNode(
    //         children.map(c => ({
    //           path: c.path,
    //           name: c.name,
    //           isDir: c.isDir,
    //           children: c.children,
    //         })),
    //         sourcePath
    //       );
    //       if (result.found) {
    //         foundNode = result.found;
    //         next.set(
    //           folderPath,
    //           result.remaining.map(item => ({
    //             id: item.path,
    //             name: item.name,
    //             path: item.path,
    //             isDir: item.isDir,
    //             children: item.isDir ? [] : undefined,
    //           }))
    //         );
    //       }
    //     });
    //     return next;
    //   });
    // } else {
    //   // Remove from root items
    //   setRootItems(prev => prev.filter(item => item.path !== sourcePath));
    // }

    // // Add to destination if we found the node
    // if (foundNode) {
    //   const destinationParentPath = destinationPath.substring(0, destinationPath.lastIndexOf('/')) || '/';
    //   const newName = destinationPath.substring(destinationPath.lastIndexOf('/') + 1);

    //   // Update the moved node with new path and name
    //   const updatedNode: TreeItem = {
    //     path: destinationPath,
    //     name: newName,
    //     isDir: foundNode.isDir,
    //     children: foundNode.children,
    //   };

    //   // If destination is root, add to rootItems
    //   if (destinationParentPath === '/' || destinationParentPath === '') {
    //     setRootItems(prev => [...prev, updatedNode]);
    //   } else {
    //     // Add to loaded children of destination parent
    //     setLoadedChildren(prev => {
    //       const next = new Map(prev);
    //       const parentChildren = next.get(destinationParentPath) || [];
    //       const newNode: TreeNode = {
    //         id: updatedNode.path,
    //         name: updatedNode.name,
    //         path: updatedNode.path,
    //         isDir: updatedNode.isDir,
    //         children: updatedNode.isDir ? [] : undefined,
    //       };
    //       next.set(destinationParentPath, [...parentChildren, newNode]);
    //       return next;
    //     });
    //   }
    // }
  }, [rootItems]);

  // Fetch root on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchTree(path, true);
    } else {
      setRootItems([]);
      setError(null);
      setLoadedChildren(new Map());
      setLoadingFolders(new Set());
    }
  }, [path, isAuthenticated, fetchTree]);

  return {
    rootItems,
    loadedChildren,
    loadingFolders,
    error,
    loading,
    fetchTree,
    renameNodeInState,
    moveNodeInState,
    setError,
  };
};
// #endregion 

// #region Components
const RightElement = ({
  node,
  onCreateFile,
  onCreateFolder,
  onCopyLink,
  onRenameClick,
  onRemoveFile,
  onSelect,
  onOpenCreatePage,
}: {
  node: NodeApi<TreeNode>;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onCopyLink?: (path: string) => void;
  onRenameClick?: (path: string) => void;
  onRemoveFile?: (path: string) => void;
  onSelect?: (path: string) => void;
  onOpenCreatePage?: (path: string) => void;
}) => {

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // create file first

    const targetPath = node.data.isDir
      ? node.data.path
      : node.data.path.substring(0, node.data.path.lastIndexOf('/')) || '/';

    onOpenCreatePage?.(targetPath);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* FOLDERS */}
      {node.data.isDir && (
        <>
          <Dropdown
            classNames={{
              base: "before:bg-default-200", // change arrow background
              content:
                "bg-background/90 text-foreground border-none backdrop-blur-xs",
            }}
          >
            <DropdownTrigger>
              <button
                className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
                title="More options"
                aria-label="More options"
              >
                <Ellipsis className="h-3 text-foreground" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions"
            >
              <DropdownItem key="new_folder" onPress={() => onCreateFolder?.(node.data.path)}>New folder</DropdownItem>
              <DropdownItem key="copy" onPress={() => onCopyLink?.(node.data.path)}>Copy link</DropdownItem>
              <DropdownItem key="rename" onPress={() => onRenameClick?.(node.data.path)}>Rename folder</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => onRemoveFile?.(node.data.path)}>
                Delete folder
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <button
            className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
            onClick={handleCreateClick}
            title="New file or folder"
            aria-label="New file or folder"
          >
            <Plus className="h-3 text-foreground" />
          </button>
        </>
      )}
      {/* FILES */}
      {!node.data.isDir && (
        <>
          <Dropdown
            classNames={{
              base: "before:bg-default-200", // change arrow background
              content:
                "bg-background/90 text-foreground border-none backdrop-blur-xs",
            }}>
            <DropdownTrigger>
              <button
                className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
                title="More options"
                aria-label="More options"
              >
                <Ellipsis className="h-3 text-foreground" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
              <DropdownItem key="copy" onPress={() => onCopyLink?.(node.data.path)}>Copy link</DropdownItem>
              <DropdownItem key="edit_file" onPress={() => onSelect?.(node.data.path)}>Edit file</DropdownItem>
              <DropdownItem key="rename_file" onPress={() => onRenameClick?.(node.data.path)}>Rename file</DropdownItem>
              <DropdownItem key="delete_file" onPress={() => onRemoveFile?.(node.data.path)}>Delete file</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </>
      )}

    </div>
  );
};

const Node = ({
  node,
  style,
  dragHandle,
  loadingFolders,
  onCreateFile,
  onCreateFolder,
  onCopyLink,
  onRename,
  onRemoveFile,
  onSelect,
  onOpenCreatePage,
}: NodeComponentProps) => {
  // isInternal is true for folders
  // const Icon = node.isInternal && node.data.isDir
  // ? <FolderIcon className="w-4 h-4 text-primary" />
  // : <FileIcon className="w-4 h-4 text-foreground" />;

  const isSelected = node.isSelected;
  const isFocused = node.isFocused;
  const isLoading = node.isInternal && loadingFolders?.has(node.data.path);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);


  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isInternal) {
      node.toggle();
    } else {
      node.select();
      node.activate();
    }
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== node.data.name) {
      onRename?.(node.data.path, newName.trim());
    }
    setIsRenameOpen(false);
    setNewName('');
  };

  const handleRenameCancel = () => {
    setIsRenameOpen(false);
    setNewName('');
  };

  const handleRenameClick = () => {
    setIsRenameOpen(true);
    // setNewName();
  };

  useEffect(() => {
    if (isRenameOpen) {
      setNewName(extractFileName(node.data.name) || '');
      // Delay focus slightly to allow dropdown/row re-renders to settle
      const timer = setTimeout(() => {
        if (renameInputRef.current) {
          // debugger;
          renameInputRef.current.focus();
          renameInputRef.current.select();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isRenameOpen]);


  return (
    <>
      <div
        ref={dragHandle}
        style={{
          ...style,
          transition: 'top 0.05s ease-in',
        }}
        className={`group flex items-center gap-1 px-2 py-1 cursor-pointer select-none rounded-lg hover:bg-primary/10 
        ${isSelected ? 'bg-primary/79' : isFocused ? 'bg-primary' : 'hover:bg-primary'} 
        ${node.isInternal ? 'font-medium' : ''}`}
        onClick={handleClick}
      >

        {/* Arrow indicator */}
        <span className="flex-shrink-1 w-4 text-center text-foreground">
          {node.isInternal && (
            isLoading ? (
              <Spinner size="sm" color="primary" className="h-5 w-4 mx-auto" variant="simple" />
            ) : node.isOpen ? (
              <ChevronDownIcon className="w-5 h-4 text-foreground" />
            ) : (
              <ChevronRightIcon className="w-5 h-4 text-foreground" />
            )
          )}
        </span>

        {/* Icon */}
        {/* <span className="flex-shrink-1">{Icon}</span> */}

        {/* Name */}
        <span
          className="flex-2 truncate text-sm text-foreground"
          // Prevent clicks inside the rename input from bubbling and triggering handleClick
          onClick={(e) => {
            if (isRenameOpen) {
              e.stopPropagation();
            }
          }}
        >
          {isRenameOpen ? (
            //rename input
            <input
              ref={renameInputRef}
              type="text"
              value={newName}
              className="
               w-full outline-none rounded-sm
               bg-foreground/80 text-background  
               "
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                // Prevent react-arborist tree from handling keyboard shortcuts
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                } else if (e.key === 'Escape') {
                  handleRenameCancel();
                }
              }}
            />
          ) : (
            node.data.name
          )}
        </span>

        {/* Actions */}
        <RightElement
          node={node}
          onCopyLink={onCopyLink}
          onRenameClick={handleRenameClick}
          onRemoveFile={onRemoveFile}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onSelect={onSelect}
          onOpenCreatePage={onOpenCreatePage}
        />
      </div>
    </>
  );
};
// #endregion 

// #region Main Component
const TreeView = forwardRef<TreeViewRef, TreeViewProps>(({
  path = '/',
  selectedPath,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onCopyLink,
  onRename,
  onRemoveFile,
  onOpenCreatePage,
  isAuthenticated
}, ref) => {
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const { containerRef, containerHeight } = useContainerHeight([]);

  const {
    rootItems,
    loadedChildren,
    loadingFolders,
    error,
    loading,
    fetchTree,
    renameNodeInState,
    moveNodeInState,
    setError,
  } = useTreeData(isAuthenticated, path);

  // Helper function to calculate node depth
  const getNodeDepth = useCallback((node: NodeApi<TreeNode>): number => {
    let depth = 0;
    let current = node.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }, []);

  // Helper function to ensure folder children are loaded before expanding
  const ensureFolderLoaded = useCallback(async (node: NodeApi<TreeNode>) => {
    if (!node.isInternal) return;

    const folderPath = node.data.path;
    const hasChildrenLoaded = loadedChildren.has(folderPath);
    const isCurrentlyLoading = loadingFolders.has(folderPath);

    if (!hasChildrenLoaded && !isCurrentlyLoading) {
      await fetchTree(folderPath, false);
      // Wait a bit for the tree to update
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }, [loadedChildren, loadingFolders, fetchTree]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    refreshPath: (folderPath: string) => {
      // If it's root path, refresh root
      if (folderPath === '/' || folderPath === path) {
        fetchTree(path, true);
      } else {
        // Refresh the specific folder
        fetchTree(folderPath, false);
      }
    },
    expandAll: async () => {
      const tree = treeRef.current;
      if (!tree) return;

      // Use iterative approach: keep expanding until no more nodes need expansion
      let hasMore = true;
      let iterations = 0;
      const maxIterations = 10; // Safety limit

      while (hasMore && iterations < maxIterations) {
        hasMore = false;
        const allNodes = tree.visibleNodes;

        // First, ensure all folders have their children loaded
        for (const node of allNodes) {
          if (node.isInternal) {
            await ensureFolderLoaded(node);
          }
        }

        // Wait a bit for tree to update
        await new Promise(resolve => setTimeout(resolve, 50));

        // Then expand all closed folders
        const updatedNodes = tree.visibleNodes;
        for (const node of updatedNodes) {
          if (node.isInternal && !node.isOpen) {
            node.open();
            hasMore = true;
          }
        }

        iterations++;
        // Wait before next iteration
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    },
    collapseAll: () => {
      const tree = treeRef.current;
      if (!tree) return;

      // Get all visible nodes and close folders in reverse order
      const allNodes = tree.visibleNodes;
      const folders = allNodes.filter(node => node.isInternal && node.isOpen);

      // Close in reverse to avoid issues with tree structure changes
      for (let i = folders.length - 1; i >= 0; i--) {
        folders[i].close();
      }
    },
    expandToLevel: async (level: number) => {
      const tree = treeRef.current;
      if (!tree) return;

      // First, collapse everything to start fresh
      const allNodes = tree.visibleNodes;
      const foldersToClose = allNodes.filter(node => node.isInternal && node.isOpen);
      for (let i = foldersToClose.length - 1; i >= 0; i--) {
        foldersToClose[i].close();
      }

      // Wait for collapse to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Now expand level by level up to the target
      let currentLevel = 0;
      while (currentLevel < level) {
        const currentNodes = tree.visibleNodes;

        // Ensure folders at current level have children loaded
        for (const node of currentNodes) {
          if (node.isInternal) {
            const depth = getNodeDepth(node);
            if (depth === currentLevel) {
              await ensureFolderLoaded(node);
            }
          }
        }

        // Wait for loads to complete
        await new Promise(resolve => setTimeout(resolve, 50));

        // Expand folders at current level
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
        // Wait before next level
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    },
    hasOpenFolders: () => {
      const tree = treeRef.current;
      if (!tree) return false;

      const allNodes = tree.visibleNodes;
      return allNodes.some(node => node.isInternal && node.isOpen);
    }

  }), [fetchTree, path, getNodeDepth, ensureFolderLoaded]);


  // Build tree structure
  const treeData = useMemo(() => {
    const rootNodes: TreeNode[] = rootItems.map(item => ({
      id: item.path,
      name: item.name,
      path: item.path,
      isDir: item.isDir,
      children: item.isDir
        ? (loadedChildren.get(item.path) || [])
        : undefined,
    }));

    const populateChildren = (nodes: TreeNode[]): TreeNode[] => {
      const sorted = sortByTypeAndName(nodes);
      return sorted.map(node => {
        // If it's a folder and we have loaded children for it, populate them
        if (node.isDir && Array.isArray(node.children) && loadedChildren.has(node.path)) {
          return {
            ...node,
            children: populateChildren(loadedChildren.get(node.path)!),
          };
        }
        // Ensure folders always have children array (even if empty) so react-arborist treats them as folders
        if (node.isDir && !Array.isArray(node.children)) {
          return {
            ...node,
            children: [],
          };
        }
        return node;
      });
    };

    return populateChildren(rootNodes);
  }, [rootItems, loadedChildren]);

  // Handle folder toggle
  const handleToggle = useCallback((id: string) => {
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
  }, [loadedChildren, loadingFolders, fetchTree]);

  // Handle node activation (file click)
  const handleActivate = useCallback((node: NodeApi<TreeNode>) => {
    if (!node.isInternal) {
      onSelect(node.data.path);
    }
  }, [onSelect]);

  const handleRenameInTree = useCallback(
    (oldPath: string, newName: string) => {
      // Let parent handle backend rename / navigation
      onRename?.(oldPath, newName);
      // Update local tree data so the label changes without reload
      renameNodeInState(oldPath, newName);
    },
    [onRename, renameNodeInState]
  );

  // Handle drag and drop move operation
  const handleMove = useCallback(
    async (params: { dragIds: string[]; parentId: string | null; index: number; dragNodes?: NodeApi<TreeNode>[]; parentNode?: NodeApi<TreeNode> | null }) => {
      console.log('handleMove', params);
      const { dragIds, parentId, dragNodes, parentNode } = params;


      // Get source path from dragNodes if available, otherwise use dragIds[0] as the node ID
      let sourcePath: string;
      if (dragNodes && dragNodes.length > 0 && dragNodes[0]) {
        sourcePath = dragNodes[0].data.path;
      } else {
        sourcePath = dragIds[0];
      }
      // Get destination parent path
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
        destinationParentPath = '/';
      }

      // Prevent moving a folder into itself
      const tree = treeRef.current;
      if (tree && dragNodes && dragNodes[0] && dragNodes[0].data.isDir) {
        const sourceNormalized = sourcePath.replace(/\/$/, '');
        const destNormalized = destinationParentPath.replace(/\/$/, '');
        if (destNormalized.startsWith(sourceNormalized + '/') || destNormalized === sourceNormalized) {
          setError('Cannot move a folder into itself or its subdirectories');
          return;
        }
      }

      try {
        // Call the move API
        const result = await moveFile({
          sourcePath,
          destinationParentPath,
          newName: '',
        });
        console.log('result', result);

        // Refresh the source parent folder to remove the moved item
        const sourceParentPath = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '/';
        if (sourceParentPath !== destinationParentPath) {
          await fetchTree(sourceParentPath, sourceParentPath === path);
        }

        // Refresh the destination parent folder to show the moved item
        await fetchTree(destinationParentPath, destinationParentPath === path);

        // If we moved to/from root, refresh root as well
        if (sourceParentPath === path || destinationParentPath === path) {
          await fetchTree(path, true);
        }
      } catch (err: any) {
        console.error('Error moving file/folder:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to move file/folder';
        setError(errorMessage);

        // Refresh the tree to revert any visual changes
        await fetchTree(path, true);
      }
    },
    [fetchTree, path, setError]
  );


  // Auto-open to selected path
  useEffect(() => {
    if (!selectedPath || !isAuthenticated || !treeRef.current || treeData.length === 0) {
      return;
    }

    const openPathToNode = async () => {
      const tree = treeRef.current;
      if (!tree) return;

      const parentPaths = getParentPaths(selectedPath);
      if (parentPaths.length === 0) return;

      for (const folderPath of parentPaths) {
        if (folderPath === selectedPath) continue;

        const hasChildrenLoaded = loadedChildren.has(folderPath);
        const isCurrentlyLoading = loadingFolders.has(folderPath);

        if (!hasChildrenLoaded && !isCurrentlyLoading) {
          await fetchTree(folderPath, false);
        }

        await new Promise(resolve => setTimeout(resolve, 50));

        const node = tree.get(folderPath.replace(/^\//, ''));
        if (node?.isInternal && !node.isOpen) {
          node.open();
          await new Promise(resolve => setTimeout(resolve, 50));
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
  }, [selectedPath, isAuthenticated, treeData, loadedChildren, loadingFolders, fetchTree]);

  // ============================================================================
  // RENDER
  // ============================================================================

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
      {loading && rootItems.length === 0 && (
        <p className="text-foreground text-sm">Loading...</p>
      )}

      {error && (
        <p className="text-error text-sm mb-3 bg-error/10 p-2 rounded border border-error/20">
          {error}
        </p>
      )}

      {!loading && !error && treeData.length === 0 && (
        <p className="text-foreground text-sm">No files found</p>
      )}

      {treeData.length > 0 && (
        <div ref={containerRef} className="flex-1 min-h-0">
          <Tree
            ref={treeRef}
            data={treeData}
            width="100%"
            height={containerHeight}
            indent={20}
            onToggle={handleToggle}
            onActivate={handleActivate}
            onMove={handleMove as any}
            rowHeight={28}
            openByDefault={false}
          >
            {(props) => (
              <Node
                {...props}
                onRename={handleRenameInTree}
                loadingFolders={loadingFolders}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onCopyLink={onCopyLink}
                onRemoveFile={onRemoveFile}
                onSelect={onSelect}
                onOpenCreatePage={onOpenCreatePage}
              />

            )}
          </Tree>
        </div>
      )}
    </div>
  );
});

TreeView.displayName = 'TreeView';

export default TreeView;
// #endregion 