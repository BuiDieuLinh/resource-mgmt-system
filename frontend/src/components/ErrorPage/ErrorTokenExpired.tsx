import { Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { IconClockOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ErrorTokenExpired() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = () => {
    logout();
    localStorage.removeItem('access_token');
    navigate('/auth/login', { replace: true });
  };

  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <ThemeIcon size={64} radius="xl" color="yellow" variant="light">
        <IconClockOff size={32} />
      </ThemeIcon>
      <Title order={2}>Session Expired</Title>
      <Text c="dimmed" ta="center" maw={400}>
        Your session has expired. Please log in again to continue where you left off.
      </Text>
      <Button onClick={handleLogin}>Log in again</Button>
    </Stack>
  );
}
