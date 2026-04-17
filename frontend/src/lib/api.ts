import axios from 'axios';
import { API_BASE_URL } from '@/constant/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Emit custom events so the React router can handle navigation (SPA-friendly)
export const AUTH_ERROR_EVENT = 'auth:error';

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message ?? '';

    if (status === 401) {
      localStorage.removeItem('access_token');
      import('@/stores/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      const isExpired =
        message.toLowerCase().includes('expired') || message.toLowerCase().includes('jwt');
      window.dispatchEvent(
        new CustomEvent(AUTH_ERROR_EVENT, {
          detail: { type: isExpired ? 'expired' : '401' },
        }),
      );
    }

    if (status === 403) {
      const url: string = err.config?.url ?? '';
      const isAuthPath = url.includes('/auth/') || url === '' || url === '/';
      if (isAuthPath) {
        window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, { detail: { type: '403' } }));
      }
    }

    return Promise.reject(err);
  },
);
