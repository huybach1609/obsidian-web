import axios from '@/lib/axios';
import { VimConfig } from '@/types/vimConfig';

const VIM_CONFIG_STORAGE_KEY = 'app-vim-config';

export async function getVimConfig(): Promise<VimConfig> {
  const { data } = await axios.get<VimConfig>('/vimconfig');
  return data;
}

export async function saveVimConfig(config: VimConfig): Promise<VimConfig> {
  const { data } = await axios.post<VimConfig>('/vimconfig', config);
  return data;
}

export function getVimConfigFromStorage(): VimConfig | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(VIM_CONFIG_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse vim config from storage:', e);
    return null;
  }
}

export function saveVimConfigToStorage(config: VimConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(VIM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save vim config to storage:', e);
  }
}

export function clearVimConfigFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VIM_CONFIG_STORAGE_KEY);
}
