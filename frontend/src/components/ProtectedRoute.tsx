import { Center, Loader } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { AUTH_LOGIN_URL } from '@/lib/api';
import { useEffect } from 'react';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = AUTH_LOGIN_URL;
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return <Outlet />;
}
