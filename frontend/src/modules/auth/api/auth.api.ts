import axios from 'axios';

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

const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000',
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
};
