import { Center, Loader } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useEffect } from 'react';
import { AUTH_URL } from '@/constant/config';
import { MENUS, type AppMenu } from '@/modules/app/Menu';

function flattenMenuRoles(menus: AppMenu[]): { path: string; roles: string[] }[] {
  const result: { path: string; roles: string[] }[] = [];
  for (const item of menus) {
    if (item.path && item.roles?.length) {
      result.push({ path: item.path, roles: item.roles });
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.path && child.roles?.length) {
          result.push({ path: child.path, roles: child.roles });
        }
      }
    }
  }
  return result;
}

const MENU_ROLES = flattenMenuRoles(MENUS);

function getRequiredRoles(pathname: string): string[] | null {
  const match = MENU_ROLES.filter(
    ({ path }) => pathname === path || pathname.startsWith(path + '/'),
  ).sort((a, b) => b.path.length - a.path.length)[0];
  return match?.roles ?? null;
}

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = `${AUTH_URL}login`;
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  const requiredRoles = getRequiredRoles(location.pathname);
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
    if (!hasRole) return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
