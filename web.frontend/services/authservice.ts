import axios from '@/lib/axios';

export interface LoginResponse {
  token: string;
  [key: string]: unknown;
}

export async function login(username: string, password: string) {
  const { data } = await axios.post<LoginResponse>('/login', { username, password });
  return data;
}


