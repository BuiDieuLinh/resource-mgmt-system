/**
 * Common API Response Models
 */

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  timestamp?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PageInfo {
  page: number;
  limit: number;
  total?: number;
}
