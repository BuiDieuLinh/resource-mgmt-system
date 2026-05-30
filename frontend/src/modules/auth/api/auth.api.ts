import axios from 'axios';
import { API_BASE_URL } from '@/constant/config';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  is_first_login: boolean;
  user: AuthUser;
}

export interface UserItem extends AuthUser {
  status: 'active' | 'inactive';
  is_first_login: boolean;
  createdAt: string;
}

const authClient = axios.create({
  baseURL: API_BASE_URL,
});

authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    authClient.post<{ data: LoginResponse }>('/auth/login', { email, password }),

  getMe: () => authClient.get<{ data: AuthUser }>('/auth/me'),

  changePassword: (newPassword: string) =>
    authClient.post('/auth/change-password', { newPassword }),

  listUsers: () => authClient.get<{ data: UserItem[] }>('/auth/users'),

  listRoles: () => authClient.get<{ data: { id: string; name: string }[] }>('/auth/roles'),

  createUser: (email: string, defaultRole?: string) =>
    authClient.post('/auth/admin/users', { email, defaultRole }),

  updateRoles: (id: string, roles: string[]) =>
    authClient.patch(`/auth/admin/users/${id}/roles`, { roles }),

  updateStatus: (id: string, status: 'active' | 'inactive') =>
    authClient.patch(`/auth/admin/users/${id}/status`, { status }),

  resetPassword: (id: string) => authClient.patch(`/auth/admin/users/${id}/reset-password`),
};
