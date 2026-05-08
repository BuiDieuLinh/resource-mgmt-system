export const ENV = {
  baseUrl: process.env.BASE_URL,
  authUrl: process.env.AUTH_URL,
  apiUrl:
    process.env.API_URL ||
    (process.env.BASE_URL
      ? process.env.BASE_URL.replace('frontend', 'backend')
      : 'https://backend-staging-0655.up.railway.app'),

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  manager: {
    email: process.env.MANAGER_EMAIL,
    password: process.env.MANAGER_PASSWORD,
  },
  employee: {
    email: process.env.EMPLOYEE_EMAIL,
    password: process.env.EMPLOYEE_PASSWORD,
  },
} as const;

export type Role = 'admin' | 'manager' | 'employee';

export const ROLES = {
  ADMIN: 'admin' as Role,
  MANAGER: 'manager' as Role,
  EMPLOYEE: 'employee' as Role,
};
