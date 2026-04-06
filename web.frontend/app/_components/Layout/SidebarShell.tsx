"use client";

import type { ReactNode, RefObject } from "react";
import type { UseSidebarReturn } from "@/hook/useSidebar";

import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

type RootProps = {
  children: ReactNode;
  isCollapsed: boolean;
};

function Root({ children, isCollapsed }: RootProps) {
  return (
    <div
      className={twMerge(
        "relative flex h-screen bg-background text-foreground",
        isCollapsed ? "flex-row" : "flex-col",
      )}
    >
      {children}
    </div>
  );
}

type MobileBackdropProps = {
  show: boolean;
  onClose: () => void;
  ariaLabel?: string;
};

function MobileBackdrop({
  show,
  onClose,
  ariaLabel = "Close sidebar",
}: MobileBackdropProps) {
  if (!show) {
    return null;
  }

  return (
    <button
      aria-label={ariaLabel}
      className="fixed inset-0 z-30 cursor-pointer appearance-none border-0 bg-background/50 p-0 backdrop-blur-[2px]"
      type="button"
      onClick={onClose}
    />
  );
}

type SidebarProps = {
  sidebarRef: RefObject<HTMLDivElement | null>;
  animate: "expanded" | "collapsed";
  isCollapsed: boolean;
  sidebarWidth: number;
  variants: UseSidebarReturn["sidebarVariants"];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
};

function Sidebar({
  sidebarRef,
  animate,
  isCollapsed,
  sidebarWidth,
  variants,
  onMouseEnter,
  onMouseLeave,
  children,
}: SidebarProps) {
  return (
    <motion.div
      ref={sidebarRef}
      animate={animate}
      className={twMerge(
        "fixed left-0 z-40 flex flex-col bg-background",
        isCollapsed
          ? "h-[90%] w-10 -translate-y-1/2 rounded-r-lg border-1 border-foreground/20 bg-background/80 top-1/2"
          : "top-0 bottom-0",
      )}
      initial={false}
      style={{ width: sidebarWidth }}
      variants={variants}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
}

type MainProps = {
  marginLeft: number;
  children: ReactNode;
};

function Main({ marginLeft, children }: MainProps) {
  return (
    <motion.div
      className="min-w-0 flex-1"
      style={{ marginLeft }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 70,
      }}
    >
      {children}
    </motion.div>
  );
}

type ResizeHandleProps = {
  show: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
};

function ResizeHandle({ show, onMouseDown }: ResizeHandleProps) {
  if (!show) {
    return null;
  }

  return (
    <button
      aria-label="Resize sidebar"
      className="group absolute top-0 right-0 bottom-0 z-50 w-3 cursor-col-resize transition-all hover:w-1.5 hover:bg-accent/30"
      style={{ touchAction: "none" }}
      type="button"
      onMouseDown={onMouseDown}
    >
      <div className="absolute top-1/2 right-0 h-12 w-0.5 -translate-y-1/2 rounded-full bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export const SidebarShell = {
  Root,
  MobileBackdrop,
  Sidebar,
  Main,
  ResizeHandle,
};
