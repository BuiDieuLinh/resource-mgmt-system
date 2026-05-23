export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/';

export const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:5173/';

export const URL_API_GET_EMPLOYEES = 'employees';

export const URL_API_GET_DEPARTMENTS = 'departments';

export const URL_API_GET_POSITIONS = 'positions';

export const URL_API_GET_ATTENDANCES = 'attendances';

export const URL_API_WORK_POLICIES = 'work-policies';

export const URL_API_LEAVE_REQUESTS = 'leave-requests';

export const URL_API_PERFORMANCES = 'performance';

export const URL_API_HOLIDAYS = 'holidays';

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_LOCALE = 'vi-VN';

// Company branding — override via .env
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Company Vietnam';
export const COMPANY_TAGLINE = import.meta.env.VITE_COMPANY_TAGLINE || 'Excellence in Every Step';
export const COMPANY_LOGO_URL = import.meta.env.VITE_COMPANY_LOGO_URL || '';
