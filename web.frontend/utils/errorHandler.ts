import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  isNetworkError: boolean;
}

/**
 * Handles HTTP status codes and returns user-friendly error messages
 */
export function handleApiError(error: unknown): ApiError {
  // Network errors (no response from server)
  if (error instanceof AxiosError) {
    // Network errors (connection refused, timeout, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED') {
        return {
          message: 'Cannot connect to server. Please check if the backend server is running.',
          isNetworkError: true,
        };
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return {
          message: 'Request timed out. Please check your connection and try again.',
          isNetworkError: true,
        };
      }
      if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
        return {
          message: 'Network error. Please check your internet connection.',
          isNetworkError: true,
        };
      }
      return {
        message: 'Unable to reach server. Please check your connection.',
        isNetworkError: true,
      };
    }

    // HTTP status code errors
    const statusCode = error.response.status;
    const errorData = error.response.data;

    // Try to extract message from response data
    const serverMessage = 
      typeof errorData === 'object' && errorData !== null
        ? (errorData as any).message || (errorData as any).error
        : typeof errorData === 'string'
        ? errorData
        : null;

    switch (statusCode) {
      case 400:
        return {
          message: serverMessage || 'Bad request. Please check your input and try again.',
          statusCode: 400,
          isNetworkError: false,
        };
      case 401:
        return {
          message: serverMessage || 'Invalid username or password.',
          statusCode: 401,
          isNetworkError: false,
        };
      case 403:
        return {
          message: serverMessage || 'Access forbidden. You do not have permission to perform this action.',
          statusCode: 403,
          isNetworkError: false,
        };
      case 404:
        return {
          message: serverMessage || 'Resource not found. Please check the URL and try again.',
          statusCode: 404,
          isNetworkError: false,
        };
      case 409:
        return {
          message: serverMessage || 'Conflict. This resource already exists.',
          statusCode: 409,
          isNetworkError: false,
        };
      case 422:
        return {
          message: serverMessage || 'Validation error. Please check your input.',
          statusCode: 422,
          isNetworkError: false,
        };
      case 429:
        return {
          message: serverMessage || 'Too many requests. Please wait a moment and try again.',
          statusCode: 429,
          isNetworkError: false,
        };
      case 500:
        return {
          message: serverMessage || 'Internal server error. Please try again later.',
          statusCode: 500,
          isNetworkError: false,
        };
      case 502:
        return {
          message: serverMessage || 'Bad gateway. The server is temporarily unavailable.',
          statusCode: 502,
          isNetworkError: false,
        };
      case 503:
        return {
          message: serverMessage || 'Service unavailable. The server is temporarily down for maintenance.',
          statusCode: 503,
          isNetworkError: false,
        };
      case 504:
        return {
          message: serverMessage || 'Gateway timeout. The server took too long to respond.',
          statusCode: 504,
          isNetworkError: false,
        };
      default:
        return {
          message: serverMessage || `Request failed with status code ${statusCode}. Please try again.`,
          statusCode,
          isNetworkError: false,
        };
    }
  }

  // Non-Axios errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred. Please try again.',
      isNetworkError: false,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred. Please try again.',
    isNetworkError: false,
  };
}

/**
 * Formats error message for display in UI
 */
export function formatErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}
