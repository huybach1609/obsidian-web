'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Tree } from 'react-arborist';
import type { NodeApi, TreeApi } from 'react-arborist';
import { getTree } from '@/services/fileservice';
import { ChevronDownIcon, ChevronRightIcon, Ellipsis, EllipsisVerticalIcon, FileIcon, FolderIcon, Plus, TrashIcon } from 'lucide-react';
import { Button, ButtonGroup, Spinner } from '@heroui/react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TreeItem {
  path: string;
  name: string;
  isDir: boolean;
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
  onShowOptions?: (node: TreeNode) => void;
  isAuthenticated: boolean;
}

interface NodeComponentProps {
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
  dragHandle?: any;
  loadingFolders?: Set<string>;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onShowOptions?: (node: TreeNode) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sortByTypeAndName = <T extends { isDir: boolean; name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    // Folders first, then files
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    // Same type: sort alphabetically (case-insensitive)
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
};

const getParentPaths = (filePath: string): string[] => {
  if (!filePath || filePath === '/') return [];

  const parts = filePath.split('/').filter(p => p);
  const parentPaths: string[] = [];

  for (let i = 1; i <= parts.length; i++) {
    parentPaths.push('/' + parts.slice(0, i).join('/'));
  }

  return parentPaths;
};
// ============================================================================
// CUSTOM HOOKS
// ============================================================================

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

  const fetchTree = useCallback(async (folderPath: string, isRoot: boolean = false) => {
    if (!isAuthenticated) return;

    if (isRoot) {
      setLoading(true);
    } else {
      setLoadingFolders(prev => new Set(prev).add(folderPath));
    }
    setError(null);

    try {
      const data = await getTree(folderPath);
      const sortedData = sortByTypeAndName(data);

      if (isRoot) {
        setRootItems(sortedData);
      } else {
        const children: TreeNode[] = sortedData.map((item: TreeItem) => ({
          id: item.path,
          name: item.name,
          path: item.path,
          isDir: item.isDir,
          children: item.isDir ? [] : undefined,
        }));

        setLoadedChildren(prev => new Map(prev).set(folderPath, children));
      }
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
  }, [isAuthenticated]);

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
  };
};


// ============================================================================
// COMPONENTS
// ============================================================================

const RightElement = ({ 
  node, 
  onCreateFile, 
  onCreateFolder, 
  onShowOptions 
}: { 
  node: NodeApi<TreeNode>;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onShowOptions?: (node: TreeNode) => void;
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
      onCreateFile(targetPath);
    }
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.select();
    onShowOptions?.(node.data);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
        onClick={handleOptionsClick}
        title="More options"
        aria-label="More options"
      >
        <Ellipsis className="h-3 text-foreground" />
      </button>
      <button
        className="w-6 h-6 hover:bg-primary/10 rounded-sm p-1 flex items-center justify-center"
        onClick={handleCreateClick}
        title={node.data.isDir ? "New file or folder" : "New file"}
        aria-label={node.data.isDir ? "New file or folder" : "New file"}
      >
        <Plus className="h-3 text-foreground" />
      </button>
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
  onShowOptions,
}: NodeComponentProps) => {
  const Icon = node.isInternal 
    ? <FolderIcon className="w-4 h-4 text-primary" /> 
    : <FileIcon className="w-4 h-4 text-foreground" />;
  
  const isSelected = node.isSelected;
  const isFocused = node.isFocused;
  const isLoading = node.isInternal && loadingFolders?.has(node.data.path);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isInternal) {
      node.toggle();
    } else {
      node.select();
      node.activate();
    }
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`group flex items-center gap-2 px-2 py-1 cursor-pointer select-none rounded-lg hover:bg-primary/10 
        ${isSelected ? 'bg-primary/80' : isFocused ? 'bg-primary' : 'hover:bg-primary'} 
        ${node.isInternal ? 'font-medium' : ''}`}
      onClick={handleClick}
    >
      {/* Arrow indicator */}
      <span className="flex-shrink-0 w-4 text-center text-foreground">
        {node.isInternal && (
          isLoading ? (
            <Spinner size="sm" color="primary" className="h-4 w-4 mx-auto" variant="simple" />
          ) : node.isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-foreground" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-foreground" />
          )
        )}
      </span>
      
      {/* Icon */}
      <span className="flex-shrink-0">{Icon}</span>
      
      {/* Name */}
      <span className="flex-1 truncate text-sm text-foreground">{node.data.name}</span>
      
      {/* Actions */}
      <RightElement 
        node={node} 
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
        onShowOptions={onShowOptions}
      />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TreeView({ 
  path = '/', 
  selectedPath, 
  onSelect, 
  onCreateFile,
  onCreateFolder,
  onShowOptions,
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
        if (node.isDir && Array.isArray(node.children) && loadedChildren.has(node.path)) {
          return {
            ...node,
            children: populateChildren(loadedChildren.get(node.path)!),
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
                loadingFolders={loadingFolders}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onShowOptions={onShowOptions}
              />
            )}
          </Tree>
        </div>
      )}
    </div>
  );
}
