// contexts/PlatformContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { isWebView, isMobileDevice } from '@/utils/platform';

type PlatformContextType = {
  isWebView: boolean;
  isMobile: boolean;
  isWeb: boolean;
};

const PlatformContext = createContext<PlatformContextType>({
  isWebView: false,
  isMobile: false,
  isWeb: true,
});

export const PlatformProvider = ({ children }: { children: React.ReactNode }) => {
  const [platform, setPlatform] = useState<PlatformContextType>({
    isWebView: false,
    isMobile: false,
    isWeb: true,
  });

  useEffect(() => {
    const webView = isWebView();
    const mobile = isMobileDevice();
    
    setPlatform({
      isWebView: webView,
      isMobile: mobile,
      isWeb: !webView && !mobile,
    });
  }, []);

  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);