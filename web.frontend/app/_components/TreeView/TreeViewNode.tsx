"use client";

/**
 * Renderer một node (hàng) cho react-arborist: mũi tên, spinner load, tên/rename, RightElement.
 */

import type { TreeViewNodeProps } from "./types";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Spinner } from "@heroui/react";

import { RightElement } from "./RightElement";
import { useTreeViewRow } from "./TreeViewRowContext";

import { extractFileName } from "@/utils/stringhelper";

export function TreeViewRow({ node, style, dragHandle }: TreeViewNodeProps) {
  const { loadingFolders, onRename } = useTreeViewRow();

  const isSelected = node.isSelected;
  const isFocused = node.isFocused;
  const isLoading = node.isInternal && loadingFolders.has(node.data.path);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const activateNode = () => {
    if (node.isInternal) {
      node.toggle();
    } else {
      node.select();
      node.activate();
    }
  };

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    activateNode();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      activateNode();
    }
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== node.data.name) {
      onRename?.(node.data.path, newName.trim());
    }
    setIsRenameOpen(false);
    setNewName("");
  };

  const handleRenameCancel = () => {
    setIsRenameOpen(false);
    setNewName("");
  };

  const handleRenameClick = () => {
    setIsRenameOpen(true);
  };

  useEffect(() => {
    if (isRenameOpen) {
      setNewName(extractFileName(node.data.name) || "");
      const timer = setTimeout(() => {
        if (renameInputRef.current) {
          renameInputRef.current.focus();
          renameInputRef.current.select();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isRenameOpen, node.data.name]);

  return (
    <div
      ref={dragHandle}
      className={`group flex items-center gap-1 px-2 py-1 cursor-pointer select-none rounded-lg hover:bg-accent/10 
        ${isSelected ? "bg-accent/79" : isFocused ? "bg-accent" : "hover:bg-accent"} 
        ${node.isInternal ? "font-medium" : ""}`}
      role="button"
      style={{
        ...style,
        transition: "top 0.05s ease-in",
      }}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="flex-shrink-1 w-4 text-center text-foreground">
        {node.isInternal &&
          (isLoading ? (
            <Spinner className="h-5 w-4 mx-auto" color="accent" size="sm" />
          ) : node.isOpen ? (
            <ChevronDownIcon className="w-5 h-4 text-foreground" />
          ) : (
            <ChevronRightIcon className="w-5 h-4 text-foreground" />
          ))}
      </span>

      <span className="flex-2 truncate text-sm text-foreground">
        {isRenameOpen ? (
          <input
            ref={renameInputRef}
            className="
               w-full outline-none rounded-sm
               bg-foreground/80 text-background  
               "
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                handleRenameSubmit();
              } else if (e.key === "Escape") {
                handleRenameCancel();
              }
            }}
          />
        ) : (
          node.data.name
        )}
      </span>

      <RightElement node={node} onRenameClick={handleRenameClick} />
    </div>
  );
}
