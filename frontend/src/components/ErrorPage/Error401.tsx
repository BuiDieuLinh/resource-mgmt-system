import { Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Error401() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = () => {
    logout();
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  };

  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <ThemeIcon size={64} radius="xl" color="orange" variant="light">
        <IconLock size={34} />
      </ThemeIcon>
      <Title order={2}>401 — Unauthorized</Title>
      <Text c="dimmed" ta="center" maw={400}>
        Your session has expired or you are not authenticated. Please log in again to continue.
      </Text>
      <Button onClick={handleLogin}>Back to Login</Button>
    </Stack>
  );
}
