import { useState, useEffect, useCallback, useRef } from 'react';
import { VimConfig, defaultVimConfig } from '@/types/vimConfig';
import { 
  getVimConfig, 
  saveVimConfig, 
  getVimConfigFromStorage, 
  saveVimConfigToStorage 
} from '@/services/vimconfigservice';

interface UseVimConfigReturn {
  config: VimConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  updateConfig: (newConfig: VimConfig) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

/**
 * Custom hook for managing Vim configuration with Stale-While-Revalidate strategy
 * 
 * On Load:
 * - Immediately loads from localStorage (if available) for instant UI
 * - Simultaneously fetches from API in background
 * - Compares timestamps and updates if server version is newer
 * 
 * On Save:
 * - Updates state and localStorage immediately (Optimistic UI)
 * - Sends to backend via POST
 * - Updates with server response (including updated timestamps)
 */
export function useVimConfig(): UseVimConfigReturn {
  const [config, setConfig] = useState<VimConfig>(defaultVimConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load config on mount with stale-while-revalidate
  useEffect(() => {
    const loadConfig = async () => {
      
      setIsLoading(true);
      setError(null);

      // Step 1: Load from localStorage immediately (stale data for instant UI)
      const storedConfig = getVimConfigFromStorage();
      if (storedConfig) {
        setConfig(storedConfig);
        setIsLoading(false); // UI can render immediately
      }

      // Step 2: Fetch from API in background (revalidate)
      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const serverConfig = await getVimConfig();
        
        // Step 3: Compare timestamps and update if server is newer
        if (storedConfig) {
          const storedUpdatedAt = storedConfig.updatedAt 
            ? new Date(storedConfig.updatedAt).getTime() 
            : 0;
          const serverUpdatedAt = serverConfig.updatedAt 
            ? new Date(serverConfig.updatedAt).getTime() 
            : 0;

          // If server version is newer, update both state and storage
          if (serverUpdatedAt > storedUpdatedAt) {
            setConfig(serverConfig);
            saveVimConfigToStorage(serverConfig);
          }
        } else {
          // No stored config, use server config
          setConfig(serverConfig);
          saveVimConfigToStorage(serverConfig);
        }
      } catch (err) {
        // If API fails but we have stored config, keep using it
        if (!storedConfig) {
          setError(err instanceof Error ? err : new Error('Failed to load config'));
          setConfig(defaultVimConfig);
        }
        // If we have stored config, silently continue using it
        console.warn('Failed to fetch vim config from server, using cached version:', err);
      } finally {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadConfig();

    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update config (optimistic update + sync to server)
  const updateConfig = useCallback(async (newConfig: VimConfig) => {
    setIsSaving(true);
    setError(null);

    // Optimistic update: update state and localStorage immediately
    setConfig(newConfig);
    saveVimConfigToStorage(newConfig);

    try {
      // Send to backend
      const serverConfig = await saveVimConfig(newConfig);
      
      // Update with server response (includes updated timestamps)
      setConfig(serverConfig);
      saveVimConfigToStorage(serverConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save config'));
      // Revert to previous config on error
      const storedConfig = getVimConfigFromStorage();
      if (storedConfig) {
        setConfig(storedConfig);
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Refresh config from server
  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const serverConfig = await getVimConfig();
      setConfig(serverConfig);
      saveVimConfigToStorage(serverConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh config'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    config,
    isLoading,
    isSaving,
    error,
    updateConfig,
    refreshConfig,
  };
}
