"use client";

/**
 * Cụm nút bên phải mỗi hàng (dropdown: folder/file, copy, rename, delete, tạo mới).
 * Đọc handlers từ TreeViewRowContext; `onRenameClick` do hàng cha cấp (mở input rename).
 */

import type { MouseEvent } from "react";
import type { NodeApi } from "react-arborist";
import type { TreeNode } from "./types";

import { Ellipsis, Plus } from "lucide-react";
import { Button, Dropdown } from "@heroui/react";

import { useTreeViewRow } from "./TreeViewRowContext";

export function RightElement({
  node,
  onRenameClick,
}: {
  node: NodeApi<TreeNode>;
  onRenameClick?: (path: string) => void;
}) {
  const {
    onCreateFolder,
    onCopyLink,
    onRemoveFile,
    onSelect,
    onOpenCreatePage,
  } = useTreeViewRow();

  const handleCreateClick = (e: MouseEvent) => {
    e.stopPropagation();

    const targetPath = node.data.isDir
      ? node.data.path
      : node.data.path.substring(0, node.data.path.lastIndexOf("/")) || "/";

    onOpenCreatePage?.(targetPath);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {node.data.isDir && (
        <>
          <Dropdown className="before:bg-default-200 bg-background/90 text-foreground border-none backdrop-blur-xs">
            <Button
              isIconOnly
              aria-label="More options"
              className="w-6 h-6 min-w-6 hover:bg-accent/10 p-1"
              variant="ghost"
            >
              <Ellipsis className="h-3 text-foreground" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Static Actions">
                <Dropdown.Item
                  id="new_folder"
                  onPress={() => onCreateFolder?.(node.data.path)}
                >
                  New folder
                </Dropdown.Item>
                <Dropdown.Item
                  id="copy"
                  onPress={() => onCopyLink?.(node.data.path)}
                >
                  Copy link
                </Dropdown.Item>
                <Dropdown.Item
                  id="rename"
                  onPress={() => onRenameClick?.(node.data.path)}
                >
                  Rename folder
                </Dropdown.Item>
                <Dropdown.Item
                  id="delete"
                  variant="danger"
                  onPress={() => onRemoveFile?.(node.data.path)}
                >
                  Delete folder
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <button
            aria-label="New file or folder"
            className="w-6 h-6 hover:bg-accent/10 rounded-sm p-1 flex items-center justify-center"
            title="New file or folder"
            type="button"
            onClick={handleCreateClick}
          >
            <Plus className="h-3 text-foreground" />
          </button>
        </>
      )}
      {!node.data.isDir && (
        <>
          <Dropdown className="before:bg-default-200 bg-background/90 text-foreground border-none backdrop-blur-xs">
            <Button
              isIconOnly
              aria-label="More options"
              className="w-6 h-6 min-w-6 hover:bg-accent/10 rounded-[var(--radius)]  p-1"
              variant="ghost"
            >
              <Ellipsis className="h-3 text-foreground" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Static Actions">
                <Dropdown.Item
                  id="copy"
                  onPress={() => onCopyLink?.(node.data.path)}
                >
                  Copy link
                </Dropdown.Item>
                <Dropdown.Item
                  id="edit_file"
                  onPress={() => onSelect?.(node.data.path)}
                >
                  Edit file
                </Dropdown.Item>
                <Dropdown.Item
                  id="rename_file"
                  onPress={() => onRenameClick?.(node.data.path)}
                >
                  Rename file
                </Dropdown.Item>
                <Dropdown.Item
                  id="delete_file"
                  onPress={() => onRemoveFile?.(node.data.path)}
                >
                  Delete file
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </>
      )}
    </div>
  );
}
