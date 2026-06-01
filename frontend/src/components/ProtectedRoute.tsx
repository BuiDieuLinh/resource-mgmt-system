import { Center, Loader } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
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
  const exactMatch = MENU_ROLES.find(({ path }) => pathname === path);
  if (exactMatch) return exactMatch.roles;

  if (pathname.match(/^\/employees\/[^/]+\/profile$/) || pathname === '/my/profile') {
    return null;
  }

  const match = MENU_ROLES.filter(({ path }) => pathname.startsWith(path + '/')).sort(
    (a, b) => b.path.length - a.path.length,
  )[0];

  return match?.roles ?? null;
}

export default function ProtectedRoute() {
  const { user, isLoading, isFirstLogin } = useAuth();
  const location = useLocation();

  if (isLoading || !user) {
    return isLoading ? (
      <Center h="100vh">
        <Loader />
      </Center>
    ) : (
      <Navigate
        to="/login"
        replace
        state={location.pathname !== '/change-password' ? { from: location.pathname } : undefined}
      />
    );
  }

  if (isFirstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (location.pathname === '/') {
    return <Outlet />;
  }

  const isProfileRoute =
    location.pathname.match(/^\/employees\/[^/]+\/profile$/) || location.pathname === '/my/profile';

  if (isProfileRoute) {
    return <Outlet />;
  }

  const requiredRoles = getRequiredRoles(location.pathname);

  if (!requiredRoles || requiredRoles.length === 0) {
    return <Outlet />;
  }

  const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
  if (!hasRole) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
