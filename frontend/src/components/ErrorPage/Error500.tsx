import { Container, Title, Text, Button, Stack, Transition } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Error500() {
  const navigate = useNavigate();

  return (
    <Transition mounted transition="scale" duration={400} timingFunction="ease">
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
            <IconAlertTriangle size={66} stroke={1.5} color="red" />

            <Title order={1} size={120} c="red">
              500
            </Title>

            <Title order={2}>Lỗi hệ thống</Title>

            <Text c="dimmed" ta="center">
              Có lỗi xảy ra từ phía máy chủ. Vui lòng thử lại sau.
            </Text>

            <Button color="red" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          </Stack>
        </Container>
      )}
    </Transition>
  );
}
