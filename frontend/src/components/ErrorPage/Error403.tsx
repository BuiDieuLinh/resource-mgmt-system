import { Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { IconShieldOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Error403() {
  const navigate = useNavigate();

  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <ThemeIcon size={64} radius="xl" color="red" variant="light">
        <IconShieldOff size={34} />
      </ThemeIcon>
      <Title order={2}>403 — Forbidden</Title>
      <Text c="dimmed" ta="center" maw={400}>
        You don't have permission to access this resource. Contact your administrator if you think
        this is a mistake.
      </Text>
      <Button variant="light" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Stack>
  );
}
