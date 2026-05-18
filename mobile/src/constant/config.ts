/**
 * API Configuration
 */
export const AUTH_API_URL =
  process.env.EXPO_PUBLIC_AUTH_API_URL || 'https://api-auth-staging-80f1.up.railway.app';
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api-staging-ed1d.up.railway.app';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  EMPLOYEES: '/employees',
  DEPARTMENTS: '/departments',
  POSITIONS: '/positions',
  ATTENDANCES: '/attendances',
  WORK_POLICIES: '/work-policies',
  LEAVE_REQUESTS: '/leave-requests',
  PERFORMANCE: '/performance',
  HOLIDAYS: '/holidays',
};

/**
 * Locale & Timezone
 */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_LOCALE = 'vi-VN';

/**
 * Company Branding
 */
export const COMPANY_NAME = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Company Vietnam';
export const COMPANY_TAGLINE =
  process.env.EXPO_PUBLIC_COMPANY_TAGLINE || 'Excellence in Every Step';
export const COMPANY_LOGO_URL = process.env.EXPO_PUBLIC_COMPANY_LOGO_URL || '';

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_NUMBER = 1;
