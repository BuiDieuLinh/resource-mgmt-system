import { useEffect, useState } from 'react';
import { storageService } from '../lib/storage';
import { STORAGE_KEYS } from '../constant/config';
import { apiClient } from '../lib/api';
import { LoginRequest, User } from '../models';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setIsLoading(true);

      const token = await storageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      setIsLoggedIn(!!token);
      const userData = await storageService.getItem(STORAGE_KEYS.USER_DATA);

      if (token) {
        setIsLoggedIn(true);

        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (err) {
            console.error('Parse user error:', err);
            setUser(null);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Check login error:', err);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const loginRequest: LoginRequest = { email, password };
      const response = await apiClient.post('/auth/login', loginRequest);

      const { access_token, refresh_token, user: userData } = response.data;

      // ✅ Lưu đúng token (string)
      await storageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);

      if (refresh_token) {
        await storageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }

      if (userData) {
        await storageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUser(userData);
      }

      setIsLoggedIn(true);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';

      setError(message);
      console.error('Login error:', err);
      setIsLoggedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      await storageService.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storageService.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
      await storageService.deleteItem(STORAGE_KEYS.USER_DATA);

      setIsLoggedIn(false);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = await storageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshTokenValue) {
        throw new Error('No refresh token');
      }

      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshTokenValue,
      });

      const { access_token } = response.data;

      await storageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    } catch (err) {
      console.error('Refresh token error:', err);

      // ❗ logout nếu fail
      await logout();
      throw err;
    }
  };

  return {
    isLoading,
    isLoggedIn,
    user,
    error,
    login,
    logout,
    refreshToken,
    checkLoginStatus,
  };
};
