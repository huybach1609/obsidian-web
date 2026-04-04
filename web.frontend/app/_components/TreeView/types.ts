/**
 * Kiểu dữ liệu cây (API / react-arborist), props của TreeView và context cho mỗi hàng.
 */
import type { CSSProperties } from "react";
import type { NodeApi, TreeApi } from "react-arborist";

export interface TreeItem {
  path: string;
  name: string;
  isDir: boolean;
  children?: TreeItem[];
}

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
}

export interface TreeViewProps {
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

export interface TreeViewRowContextValue {
  loadingFolders: Set<string>;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onCopyLink?: (path: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onRemoveFile?: (path: string) => void;
  onSelect?: (path: string) => void;
  onOpenCreatePage?: (path: string) => void;
}

/** Props passed by react-arborist to the node renderer (`Tree` `children`). */
export interface TreeViewNodeProps {
  node: NodeApi<TreeNode>;
  style: CSSProperties;
  tree: TreeApi<TreeNode>;
  dragHandle?: (el: HTMLDivElement | null) => void;
  preview?: boolean;
}
