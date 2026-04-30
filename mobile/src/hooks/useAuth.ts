import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authClient } from '../lib/api';
import { STORAGE_KEYS } from '../constant/config';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkLoginStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }
      // Verify token by calling /auth/me
      const res = await authClient.get<{ data: AuthUser }>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data?.data ?? null);
      setIsLoggedIn(true);
    } catch {
      // Token invalid or expired
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN).catch(() => {});
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Auth] Logging in to:', authClient.defaults.baseURL, 'email:', email);

      const res = await authClient.post<{ data: { access_token: string; user: AuthUser } }>(
        '/auth/login',
        { email, password },
      );
      console.log('[Auth] Login response:', res.status, JSON.stringify(res.data).slice(0, 200));

      const payload = res.data?.data ?? (res.data as any);
      const access_token: string = payload?.access_token;
      const userData = payload?.user;

      if (!access_token) {
        console.error('[Auth] No access_token in response');
        setError('No token received');
        setIsLoading(false);
        return false;
      }

      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      setUser(userData ?? null);
      setIsLoggedIn(true);
      setIsLoading(false);
      console.log('[Auth] Login successful, isLoggedIn set to true');
      return true;
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Login failed';
      console.error('[Auth] Login error:', status, message);
      setError(message);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {}
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
  };

  return { isLoading, isLoggedIn, user, error, login, logout, checkLoginStatus };
};
