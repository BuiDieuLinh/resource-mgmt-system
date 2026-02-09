import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Transition,
} from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Error403() {
  const navigate = useNavigate();

  return (
    <Transition
      mounted
      transition="slide-up"
      duration={400}
      timingFunction="ease"
    >
      {(styles) => (
        <Container
          size="sm"
          h="100vh"
          style={{
            display: 'flex',
            alignItems: 'center',
            ...styles,
          }}
        >
          <Stack align="center" gap="md">
            <IconLock size={64} stroke={1.5} />

            <Title order={1} size={120} c="yellow">
              403
            </Title>

            <Title order={2}>Truy cập bị từ chối</Title>

            <Text c="dimmed" ta="center">
              Bạn không có quyền truy cập vào trang này.
            </Text>

            <Button variant="outline" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </Stack>
        </Container>
      )}
    </Transition>
  );
}
