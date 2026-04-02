import { useAuth } from '@/modules/auth/context/AuthContext';

export function useHasRole(...roles: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}
