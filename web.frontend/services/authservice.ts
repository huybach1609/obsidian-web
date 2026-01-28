import axios from '@/lib/axios';
import { handleApiError } from '@/utils/errorHandler';

export interface LoginResponse {
  token: string;
  [key: string]: unknown;
}

export interface AccountInfo {
  username: string;
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

/**
 * Registers the initial account in the system. This is intended to be called
 * only once, when the backend reports that credentials are not yet configured.
 */
export async function registerInitialAccount(username: string, password: string): Promise<void> {
  try {
    await axios.post('/register', { username, password });
  } catch (error) {
    const apiError = handleApiError(error);
    throw new LoginError(apiError.message, apiError.statusCode, apiError.isNetworkError);
  }
}

export async function getAccount(): Promise<AccountInfo> {
  try {
    const { data } = await axios.get<AccountInfo>('/account');
    return data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new LoginError(apiError.message, apiError.statusCode, apiError.isNetworkError);
  }
}

export async function updateAccount(
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
): Promise<void> {
  try {
    await axios.post('/account', {
      currentPassword,
      newUsername,
      newPassword,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    throw new LoginError(apiError.message, apiError.statusCode, apiError.isNetworkError);
  }
}


