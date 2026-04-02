import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../api/auth.api';
import { AUTH_LOGIN_URL } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigin = import.meta.env.VITE_AUTH_LOGIN_URL
        ? new URL(import.meta.env.VITE_AUTH_LOGIN_URL).origin
        : 'http://localhost:5173';

      if (event.origin !== allowedOrigin) return;
      if (event.data?.type === 'auth:token' && event.data.token) {
        localStorage.setItem('access_token', event.data.token);
        authApi
          .getMe()
          .then((res) => setUser(res.data.data))
          .catch(() => localStorage.removeItem('access_token'))
          .finally(() => setIsLoading(false));
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.opener) {
      const authOrigin = import.meta.env.VITE_AUTH_LOGIN_URL
        ? new URL(import.meta.env.VITE_AUTH_LOGIN_URL).origin
        : 'http://localhost:5173';
      window.opener.postMessage('auth:ready', authOrigin);
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      authApi
        .getMe()
        .then((res) => setUser(res.data.data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setIsLoading(false));
    } else if (!window.opener) {
      setIsLoading(false);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    window.location.href = AUTH_LOGIN_URL;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
