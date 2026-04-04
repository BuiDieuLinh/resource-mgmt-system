import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../api/auth.api';
import { AUTH_LOGIN_URL } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { AUTH_URL } from '@/constant/config';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const getAuthOrigin = () => {
  try {
    return new URL(AUTH_URL).origin;
  } catch {
    return 'http://localhost:5173';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useAuthStore((s) => s.setUser);

  const syncUser = (u: AuthUser | null) => {
    setUser(u);
    setStoreUser(u);
  };

  useEffect(() => {
    const authOrigin = getAuthOrigin();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== authOrigin) return;
      if (event.data?.type === 'auth:token' && event.data.token) {
        localStorage.setItem('access_token', event.data.token);
        authApi
          .getMe()
          .then((res) => syncUser(res.data.data))
          .catch(() => localStorage.removeItem('access_token'))
          .finally(() => setIsLoading(false));
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.opener) {
      window.opener.postMessage('auth:ready', authOrigin);

      const timeout = setTimeout(() => {
        if (!localStorage.getItem('access_token')) {
          window.location.href = AUTH_LOGIN_URL;
        }
      }, 5000);

      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(timeout);
      };
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      authApi
        .getMe()
        .then((res) => syncUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          window.location.href = AUTH_LOGIN_URL;
        })
        .finally(() => setIsLoading(false));
    } else {
      window.location.href = AUTH_LOGIN_URL;
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
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
