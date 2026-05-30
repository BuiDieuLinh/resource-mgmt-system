import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../constant/config';

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

// Attach JWT to both clients
const attachToken = async (config: any) => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
};

authClient.interceptors.request.use(attachToken);
apiClient.interceptors.request.use(attachToken);

// Handle 401 on backend client
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    if (status === 401) {
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      } catch {}
    }
    return Promise.reject(err);
  },
);
