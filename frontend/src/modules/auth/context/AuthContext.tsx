import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../api/auth.api';
import { useAuthStore } from '@/stores/useAuthStore';
import { AUTH_ERROR_EVENT } from '@/lib/api';
import { queryClient } from '@/lib/react-query';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ is_first_login: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useAuthStore((s) => s.setUser);

  const syncUser = (u: AuthUser | null) => {
    setUser(u);
    setStoreUser(u);
  };

  useEffect(() => {
    const handleAuthError = (e: Event) => {
      const { type } = (e as CustomEvent).detail;
      queryClient.clear();
      syncUser(null);
      if (type === '403') {
        window.location.replace('/403');
      } else if (type === 'expired') {
        window.location.replace('/session-expired');
      } else {
        window.location.replace('/401');
      }
    };
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);

    const token = localStorage.getItem('access_token');
    if (token) {
      authApi
        .getMe()
        .then((res) => syncUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          syncUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { access_token, user, is_first_login } = res.data.data;
    localStorage.setItem('access_token', access_token);
    syncUser(user);
    return { is_first_login };
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    queryClient.clear();
    syncUser(null);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
