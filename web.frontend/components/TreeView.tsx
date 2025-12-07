'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Tree } from 'react-arborist';
import type { NodeApi, TreeApi } from 'react-arborist';
import { getTree } from '@/services/fileservice';
import { ChevronDownIcon, ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react';
import { Spinner } from '@heroui/react';

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
  selectedPath?: string; // Path to automatically open and select in the tree
  onSelect: (path: string) => void;
  isAuthenticated: boolean;
}

export default function TreeView({ path = '/', selectedPath, onSelect, isAuthenticated }: TreeViewProps) {
  const [rootItems, setRootItems] = useState<TreeItem[]>([]);
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const headerRef = useRef<HTMLHeadingElement>(null);

  // Calculate height based on viewport height (vh)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateHeight = () => {
      setContainerHeight(window.innerHeight - 100);

    };

    // Calculate height after DOM is ready
    const updateHeight = () => {
      requestAnimationFrame(() => {
        calculateHeight();
      });
    };

    // Initial calculation with slight delay to ensure layout is complete
    const timeoutId = setTimeout(updateHeight, 0);
    const rafId = requestAnimationFrame(updateHeight);

    // Update on window resize
    window.addEventListener('resize', updateHeight);

    // Observe parent container for size changes
    const resizeObserver = new ResizeObserver(updateHeight);

    // Observe the parent element (flex container) for more accurate sizing
    const parentElement = containerRef.current?.parentElement;
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    // Also observe the container itself
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, [rootItems, error, loading]); // Recalculate when layout-affecting content changes

  // Sort function: folders first, then files, both sorted by name
  const sortTreeItems = useCallback((items: TreeItem[]): TreeItem[] => {
    return [...items].sort((a, b) => {
      // First sort by type: folders (isDir: true) come before files (isDir: false)
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      // If same type, sort by name (case-insensitive)
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, []);
  // Sort tree nodes: folders first, then files, both by name
  const sortTreeNodes = useCallback((nodes: TreeNode[]): TreeNode[] => {
    return [...nodes].sort((a, b) => {
      // First sort by type: folders (isDir: true) come before files (isDir: false)
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      // If same type, sort by name (case-insensitive)
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }, []);

  // Fetch folder contents from API
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

      // Sort the data: folders first, then files, both by name
      const sortedData = sortTreeItems(data);

      if (isRoot) {
        setRootItems(sortedData);
      } else {
        // Convert API response to tree nodes
        const children: TreeNode[] = sortedData.map((item: TreeItem) => ({
          id: item.path,
          name: item.name,
          path: item.path,
          isDir: item.isDir,
          // Folders start with empty array, files have undefined
          children: item.isDir ? [] : undefined,
        }));

        setLoadedChildren(prev => {
          const next = new Map(prev);
          next.set(folderPath, children);
          return next;
        });
      }
    } catch (err: any) {
      console.error(' Error fetching tree:', err);
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
  }, [isAuthenticated, sortTreeItems]);

  // Fetch root directory on mount
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

  // Helper function to get all parent folder paths from a file path
  const getParentPaths = useCallback((filePath: string): string[] => {
    if (!filePath || filePath === '/') return [];

    const parts = filePath.split('/').filter(p => p);
    const parentPaths: string[] = [];

    for (let i = 1; i <= parts.length; i++) {
      const parentPath = '/' + parts.slice(0, i).join('/');
      parentPaths.push(parentPath);
    }
    console.log('parentPaths', parentPaths);

    return parentPaths;
  }, [])
  // Auto-open tree to selectedPath when it changes
  useEffect(() => {
    if (!selectedPath || !isAuthenticated || !treeRef.current || treeData.length === 0) {
      return;
    }

    const openPathToNode = async () => {
      const tree = treeRef.current;
      if (!tree) return;

      // Get all parent folder paths
      const parentPaths = getParentPaths(selectedPath);
      if (parentPaths.length === 0) return;

      // Load and open all parent folders
      for (const folderPath of parentPaths) {
        // Skip if it's the target file itself (not a folder)
        if (folderPath === selectedPath) continue;

        // Check if folder needs to be loaded
        const hasChildrenLoaded = loadedChildren.has(folderPath);
        const isCurrentlyLoading = loadingFolders.has(folderPath);

        if (!hasChildrenLoaded && !isCurrentlyLoading) {
          // Load the folder
          await fetchTree(folderPath, false);
        }

        // Wait a bit for the tree to update after loading
        await new Promise(resolve => setTimeout(resolve, 50));

        // Open the folder
        const node = tree.get(folderPath.replace(/^\//, ''));

        if (node && node.isInternal && !node.isOpen) {
          node.open();
          // Wait for the tree to update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Select and focus the target node
      const targetNode = tree.get(selectedPath);
      if (targetNode) {
        targetNode.select();
        targetNode.focus();
      }
    };

    // Use a small delay to ensure tree is fully rendered
    const timeoutId = setTimeout(() => {
      openPathToNode();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedPath, isAuthenticated, treeData, loadedChildren, loadingFolders, fetchTree]);

  // Handle folder toggle - this is called AFTER react-arborist toggles the state
  const handleToggle = useCallback((id: string) => {
    const tree = treeRef.current;
    if (!tree) return;

    const node = tree.get(id);
    if (!node || !node.isInternal) return;

    const folderPath = node.data.path;
    const isOpen = node.isOpen;

    // If folder is now open and children aren't loaded, load them
    if (isOpen) {
      const hasChildrenLoaded = loadedChildren.has(folderPath);
      const isCurrentlyLoading = loadingFolders.has(folderPath);

      if (!hasChildrenLoaded && !isCurrentlyLoading) {
        fetchTree(folderPath, false);
      }
    }
  }, [loadedChildren, loadingFolders, fetchTree]);


  // Build tree data structure
  const treeData = useMemo(() => {
    // Convert root items to tree nodes (already sorted from API)
    const rootNodes: TreeNode[] = rootItems.map(item => {
      const node: TreeNode = {
        id: item.path,
        name: item.name,
        path: item.path,
        isDir: item.isDir,
      };

      if (item.isDir) {
        // If children are loaded, use them; otherwise empty array (folder exists but not loaded)
        node.children = loadedChildren.has(item.path)
          ? loadedChildren.get(item.path)!
          : [];
      }
      // Files have undefined children (leaf nodes)

      return node;
    });

    // Recursively populate nested folders and sort them
    function populateChildren(nodes: TreeNode[]): TreeNode[] {
      const sortedNodes = sortTreeNodes(nodes);
      return sortedNodes.map(node => {
        if (node.isDir && Array.isArray(node.children)) {
          // If this folder has loaded children, recursively populate and sort them
          if (loadedChildren.has(node.path)) {
            const children = loadedChildren.get(node.path)!;
            return {
              ...node,
              children: populateChildren(children),
            };
          }
          // Otherwise keep empty array (folder not loaded yet)
        }
        return node;
      });
    }

    return populateChildren(rootNodes);
  }, [rootItems, loadedChildren, sortTreeNodes]);


  // Handle node click - for files
  const handleActivate = useCallback((node: NodeApi<TreeNode>) => {
    if (!node.isInternal) {
      onSelect(node.data.path);
    }
  }, [onSelect]);

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

      {/* abnormal loading state */}
      {loading && rootItems.length === 0 && (
        <p className="text-gray-600 text-sm">Loading...</p>
      )}
      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}
      {!loading && !error && treeData.length === 0 && (
        <p className="text-gray-600 text-sm">No files found</p>
      )}
      {/* normal loading state */}
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
            {(props) => <Node {...props} loadingFolders={loadingFolders} />}
          </Tree>
        </div>
      )}
    </div>
  );
}

// Custom node renderer
function Node({ node, style, dragHandle, loadingFolders }: {
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
  dragHandle?: any;
  loadingFolders?: Set<string>;
}) {
  const Icon = node.isInternal ? <FolderIcon className="w-4 h-4 text-primary" /> : <FileIcon className="w-4 h-4 text-foreground" />;
  const isSelected = node.isSelected;
  const isFocused = node.isFocused;
  const isLoading = node.isInternal && loadingFolders?.has(node.data.path);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none rounded-lg hover:bg-primary/10 
        ${isSelected ? 'bg-primary/80' : isFocused ? 'bg-primary' : 'hover:bg-primary'} ${node.isInternal ? 'font-medium' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (node.isInternal) {
          // For folders: toggle open/close
          node.toggle();
        } else {
          // For files: select and activate
          node.select();
          node.activate();
        }

      }}
    >
      {/* Arrow indicator for folders */}
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
    </div>
  );
}
