import { Stack, Button, Alert } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export default function ErrorState({
  message = 'Something went wrong',
  onRetry,
  title = 'Error',
}: ErrorStateProps) {
  return (
    <Stack gap="md">
      <Alert variant="light" color="red.8" title={title} icon={<IconAlertCircle />}>
        {message}
      </Alert>

      {onRetry && (
        <Button
          onClick={onRetry}
          leftSection={<IconRefresh size={18} />}
          variant="light"
          color="red.8"
        >
          Retry
        </Button>
      )}
    </Stack>
  );
}
