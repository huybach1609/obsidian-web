"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toast } from "@heroui/react";

import { PlatformProvider } from "@/contexts/PlatformContext";
import { AppProvider } from "@/contexts/AppContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <ThemeProvider {...themeProps}>
      <AppProvider>
        <Toast.Provider />
        <PlatformProvider>{children}</PlatformProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
