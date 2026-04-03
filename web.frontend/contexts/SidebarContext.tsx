"use client";

import { createContext, useContext } from "react";

type SidebarContextValue = {
  toggleSidebar: () => void;
} | null;

const SidebarContext = createContext<SidebarContextValue>(null);

export const SidebarProvider = ({
  toggleSidebar,
  children,
}: {
  toggleSidebar: () => void;
  children: React.ReactNode;
}) => (
  <SidebarContext.Provider value={{ toggleSidebar }}>
    {children}
  </SidebarContext.Provider>
);

export const useSidebarContext = () => useContext(SidebarContext);
