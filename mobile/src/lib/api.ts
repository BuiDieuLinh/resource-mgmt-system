import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://localhost:5000'; // For physical device, change to your IP: 'http://192.168.1.xxx:5000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // Add timeout
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    console.error('API Error:', err.response?.data || err.message);
    const status = err.response?.status;

    if (status === 401) {
      try {
        await SecureStore.deleteItemAsync('access_token');
      } catch (error) {
        console.error('Error deleting token:', error);
      }
      // Handle logout
    }

    return Promise.reject(err);
  },
);
