import axios from '@/lib/axios';
import { handleApiError } from '@/utils/errorHandler';

export interface LoginResponse {
  token: string;
  [key: string]: unknown;
}

export class LoginError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await axios.post<LoginResponse>('/login', { username, password });
    return data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new LoginError(apiError.message, apiError.statusCode, apiError.isNetworkError);
  }
}


