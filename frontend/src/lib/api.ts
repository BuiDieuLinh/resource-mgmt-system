import axios from 'axios';
import { API_BASE_URL, AUTH_URL } from '@/constant/config';

export const AUTH_LOGIN_URL = `${AUTH_URL}login` || 'http://localhost:5173/login';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = AUTH_LOGIN_URL;
    }
    return Promise.reject(err);
  },
);
