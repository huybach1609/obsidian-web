"use client";

import { createContext, useContext } from "react";

export type SidebarContextValue = {
  toggleSidebar: () => void;
  /** Drawer/sidebar is expanded (mobile overlay open or desktop visible strip). */
  isSidebarOpen: boolean;
} | null;

const SidebarContext = createContext<SidebarContextValue>(null);

export const SidebarProvider = ({
  toggleSidebar,
  isSidebarOpen,
  children,
}: {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  children: React.ReactNode;
}) => (
  <SidebarContext.Provider value={{ toggleSidebar, isSidebarOpen }}>
    {children}
  </SidebarContext.Provider>
);

export const useSidebarContext = () => useContext(SidebarContext);
