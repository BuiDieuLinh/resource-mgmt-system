import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../api/auth.api';
import { useAuthStore } from '@/stores/useAuthStore';
import { AUTH_URL } from '@/constant/config';
import { AUTH_ERROR_EVENT } from '@/lib/api';
import { queryClient } from '@/lib/react-query';

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

  const AUTH_LOGIN_URL = `${AUTH_URL}login`;

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

    // Handle 401/403 errors from API interceptor
    const handleAuthError = (e: Event) => {
      const { type } = (e as CustomEvent).detail;
      // Clear all cached queries so stale error state doesn't persist on back navigation
      queryClient.clear();
      if (type === '403') {
        window.location.replace('/403');
      } else if (type === 'expired') {
        window.location.replace('/session-expired');
      } else {
        window.location.replace('/401');
      }
    };
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);

    if (window.opener) {
      window.opener.postMessage('auth:ready', authOrigin);

      const timeout = setTimeout(() => {
        if (!localStorage.getItem('access_token')) {
          window.location.href = AUTH_LOGIN_URL;
        }
      }, 5000);

      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
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

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
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
