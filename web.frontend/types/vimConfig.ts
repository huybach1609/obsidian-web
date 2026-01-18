export type VimMode = 'insert' | 'normal';

export interface VimKeyMapping {
  keys: string;
  action: string;
  mode: VimMode;
}

export interface VimExCommand {
  name: string;
  shortName: string;
  handler: string; // Function body as string, will be evaluated
}

export interface VimConfig {
  keyMappings: VimKeyMapping[];
  exCommands: VimExCommand[];
  unmappedKeys: Array<{ keys: string; mode: VimMode }>;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultVimConfig: VimConfig = {
  keyMappings: [],
  exCommands: [],
  unmappedKeys: [],
};
