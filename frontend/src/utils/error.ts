import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface ParsedError {
  message: string;
  status?: number;
  isForbidden: boolean;
  isUnauthorized: boolean;
  isNotFound: boolean;
}

export function parseApiError(error: unknown, defaultMessage = 'An error occurred'): ParsedError {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;
    const apiMessage = axiosError.response?.data?.message;
    const errorMessage = apiMessage || axiosError.message || defaultMessage;

    return {
      message: errorMessage,
      status,
      isForbidden: status === 403,
      isUnauthorized: status === 401,
      isNotFound: status === 404,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      status: undefined,
      isForbidden: false,
      isUnauthorized: false,
      isNotFound: false,
    };
  }

  return {
    message: defaultMessage,
    status: undefined,
    isForbidden: false,
    isUnauthorized: false,
    isNotFound: false,
  };
}

export function getErrorMessage(
  error: unknown,
  customMessages?: {
    403?: string;
    401?: string;
    404?: string;
    500?: string;
  },
): string {
  const parsed = parseApiError(error);

  if (parsed.isForbidden && customMessages?.['403']) {
    return customMessages['403'];
  }

  if (parsed.isUnauthorized && customMessages?.['401']) {
    return customMessages['401'];
  }

  if (parsed.isNotFound && customMessages?.['404']) {
    return customMessages['404'];
  }

  if (parsed.status && parsed.status >= 500 && customMessages?.['500']) {
    return customMessages['500'];
  }

  return parsed.message;
}
