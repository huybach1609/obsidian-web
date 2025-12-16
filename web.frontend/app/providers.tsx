"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { AppProvider } from "@/contexts/AppContext";
import { ToastProvider } from "@heroui/react";

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
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <AppProvider>
          <ToastProvider
            toastProps={{
              radius: "full",
              color: "primary",
              variant: "flat",
              timeout: 2000,
              hideIcon: false,
              classNames: {
                closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
              },
            }} />
          <PlatformProvider>{children}</PlatformProvider>
        </AppProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
