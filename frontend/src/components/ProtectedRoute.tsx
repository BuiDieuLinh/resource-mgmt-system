import { Center, Loader } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useEffect } from 'react';
import { AUTH_URL } from '@/constant/config';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

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

  return <Outlet />;
}
