import axios from '@/lib/axios';

export interface TreeItemDto {
  path: string;
  name: string;
  isDir: boolean;
  children?: TreeItemDto[];
}

export interface FileResponse {
  content: string;
}

export interface FileResponse {
  content: string;
  path: string;
}

/** V2 API: raw markdown for frontend rendering */
export interface FileMarkdownResponse {
  path: string;
  markdown: string;
}
export async function getTree(path: string, depth: number = 1): Promise<TreeItemDto[]> {
  const { data } = await axios.get<TreeItemDto[]>('/tree', { params: { path, depth } });
  return data;
}

export async function getFile(path: string): Promise<FileResponse> {
  const { data } = await axios.get<FileResponse>('/file', { params: { path } });
  return data;
}

export async function createFile(path: string, content: string = '') {
  const { data } = await axios.post<{ path: string }>('/file', { path, content });
  return data;
}

export async function updateFile(path: string, content: string) {
  await axios.put('/file', { path, content });
}

export async function renameFile(oldPath: string, newPath: string) {
  await axios.post('/file/rename', { oldPath, newPath });
}

export async function getFilePreview(path: string) {
  const { data } = await axios.get<string>('/preview', { params: { path } });
  return data;
}

/** Fetch raw markdown from v2 API for frontend rendering */
export async function getFileMarkdown(path: string): Promise<FileMarkdownResponse> {
  const { data } = await axios.get<FileMarkdownResponse>('/v2/preview', { params: { path } });
  return data;
}

export async function toggleCheckbox(path: string, checkboxText: string) {
  await axios.post('/file/toggle-checkbox', { path, checkboxText });
}

export async function removeFile(path: string) {
  await axios.delete('/file', { params: { path } });
}

export async function createFolder(path: string) {
  const { data } = await axios.post<{ ok: boolean; path: string }>('/folder', { path });
  return data;
}

export async function copyLink(path: string): Promise<string> {
  // Generate the full URL for the file/folder
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const link = `${baseUrl}/notes/edit${path}`;

  // Copy to clipboard if available
  if (typeof window !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(link);
      return link;
    } catch (err) {
      console.error('Failed to copy link to clipboard:', err);
      return link;
    }
  }

  return link;
}

export interface MoveRequest {
  sourcePath: string;
  destinationParentPath: string;
  newName: string;
}



export async function moveFile(moveRequest: MoveRequest) {
  console.log(moveRequest);
  const { data } = await axios.post
    ('/file/move',
      moveRequest
    );
  return data;
}

