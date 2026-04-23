import { Container, Title, Text, Button, Stack, Transition } from '@mantine/core';
import { IconMoodSad } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Error404() {
  const navigate = useNavigate();

  return (
    <Transition mounted transition="fade-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Container
          size="sm"
          h="100vh"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            ...styles,
          }}
        >
          <Stack align="center" gap="md">
            <IconMoodSad size={66} stroke={1.5} />

            <Title order={1} size={120} c="dimmed">
              404
            </Title>

            <Title order={2}>Không tìm thấy trang</Title>

            <Text c="dimmed" ta="center">
              Trang bạn đang tìm không tồn tại hoặc đã bị xoá.
            </Text>

            <Button onClick={() => navigate('/')}>Quay về trang chủ</Button>
          </Stack>
        </Container>
      )}
    </Transition>
  );
}
