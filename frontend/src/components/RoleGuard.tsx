import { Navigate } from 'react-router-dom';
import { useHasRole } from '@/hooks/useHasRole';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const allowed = useHasRole(...roles);
  if (!allowed) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
