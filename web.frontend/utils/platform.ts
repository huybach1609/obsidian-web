// utils/platform.ts
export const isWebView = () => {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || navigator.vendor;
  
  // Check for various webview indicators
  const isAndroidWebView = /wv|WebView/.test(ua) && /Android/.test(ua);
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/.test(ua);
  const isReactNativeWebView = /ReactNative/.test(ua);
  
  return isAndroidWebView || isIOSWebView || isReactNativeWebView;
};

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};