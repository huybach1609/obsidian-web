'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Tree } from 'react-arborist';
import type { NodeApi, TreeApi } from 'react-arborist';
import axios from '@/lib/axios';
import { ChevronDownIcon, ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react';

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
  onSelect: (path: string) => void;
  isAuthenticated: boolean;
}

export default function TreeView({ path = '/', onSelect, isAuthenticated }: TreeViewProps) {
  const [rootItems, setRootItems] = useState<TreeItem[]>([]);
  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Update container height when it resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

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
      console.log('fetching', `/tree?path=${folderPath}`);
      const { data } = await axios.get('/tree', { params: { path: folderPath } });
 
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

  // Handle folder toggle - this is called AFTER react-arborist toggles the state
  const handleToggle = useCallback((id: string) => {
    // console.log('handleToggle: folder', id);
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
        // console.log(`Loading children for: ${folderPath}`);
        fetchTree(folderPath, false);
      }
    }
  }, [loadedChildren, loadingFolders, fetchTree]);

  // Handle node click - for files
  const handleActivate = useCallback((node: NodeApi<TreeNode>) => {
    if (!node.isInternal) {
      // console.log(`File selected: ${node.data.path}`);
      onSelect(node.data.path);
    }
  }, [onSelect]);

  if (!isAuthenticated) {
    return (
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Files</h4>
        <p className="text-gray-600 text-sm">Please login to view files</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">Files</h4>
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
  const Icon = node.isInternal ? <FolderIcon className="w-4 h-4 text-blue-600" /> : <FileIcon className="w-4 h-4 text-gray-600" />;
  const isSelected = node.isSelected;
  const isFocused = node.isFocused;
  const isLoading = node.isInternal && loadingFolders?.has(node.data.path);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none ${
        isSelected ? 'bg-blue-100' : isFocused ? 'bg-blue-50' : 'hover:bg-gray-50'
      } ${node.isInternal ? 'font-medium' : ''}`}
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
        // console.log('clicked', node.data.path);

      }}
    >
      {/* Arrow indicator for folders */}
      <span className="flex-shrink-0 w-4 text-center text-gray-500">
        {node.isInternal && (
          isLoading ? (
            <span className="animate-spin">⟳</span>
          ) : node.isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          )
        )}
      </span>
      {/* Icon */}
      <span className="flex-shrink-0">{Icon}</span>
      {/* Name */}
      <span className="flex-1 truncate text-sm text-gray-700">{node.data.name}</span>
    </div>
  );
}
