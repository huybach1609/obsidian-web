'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Tree } from 'react-arborist';
import type { NodeApi, TreeApi } from 'react-arborist';
import { getTree } from '@/services/fileservice';
import { buildRenamedPath, extractFileName, getParentPaths, sortByTypeAndName } from '@/utils/stringhelper';
import { ChevronDownIcon, ChevronRightIcon, Ellipsis, EllipsisVerticalIcon, FileIcon, FolderIcon, Plus, TrashIcon } from 'lucide-react';
import { Button, ButtonGroup, DropdownTrigger, DropdownMenu, Dropdown, Spinner, DropdownItem, PopoverTrigger, Popover, PopoverContent, Input } from '@heroui/react';
import { useCreatePage } from '@/contexts/CreatePageContext';

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
      setContainerHeight(window.innerHeight - 100);
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

      console.log(data);

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

    // For folders: create file inside
    // For files: create file in parent directory
    const targetPath = node.data.isDir
      ? node.data.path
      : node.data.path.substring(0, node.data.path.lastIndexOf('/')) || '/';

    if (node.data.isDir && onCreateFolder) {
      onCreateFolder(targetPath);
    } else if (onCreateFile) {
      onCreateFile?.(targetPath);
    }
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
              <DropdownItem key="copy" onPress={() => onCopyLink?.(node.data.path)}>Copy link</DropdownItem>
              <DropdownItem key="rename" onPress={() => onRenameClick?.(node.data.path)}>Rename folder</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => onRemoveFile?.(node.data.path)}>
                Delete folder
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <button
            className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
            onClick={() => onOpenCreatePage?.(node.data.path)}
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
  const Icon = node.isInternal && node.data.isDir
    ? <FolderIcon className="w-4 h-4 text-primary" />
    : <FileIcon className="w-4 h-4 text-foreground" />;

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
        className={`group flex items-center gap-3 px-2 py-1 cursor-pointer select-none rounded-lg hover:bg-primary/10 
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
        <span className="flex-shrink-1">{Icon}</span>

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
export default function TreeView({
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
}: TreeViewProps) {
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
  } = useTreeData(isAuthenticated, path);


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
        <div ref={containerRef} className="flex-1 min-h-0" style={{ height: '100%' }}>
          <Tree
            ref={treeRef}
            data={treeData}
            width="100%"
            height={containerHeight}
            indent={20}
            onToggle={handleToggle}
            onActivate={handleActivate}
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
}
// #endregion 