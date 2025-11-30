import axios from '@/lib/axios';

export interface TreeItemDto {
  path: string;
  name: string;
  isDir: boolean;
}

export interface FileResponse {
  content: string;
}

export async function getTree(path: string) {
  const { data } = await axios.get<TreeItemDto[]>('/tree', { params: { path } });
  return data;
}

export async function getFile(path: string) {
  const { data } = await axios.get<FileResponse>('/file', { params: { path } });
  return data;
}

export async function updateFile(path: string, content: string) {
  await axios.put('/file', { path, content });
}

export async function getFilePreview(path: string) {
  const { data } = await axios.get<string>('/preview', { params: { path } });
  return data;
}


