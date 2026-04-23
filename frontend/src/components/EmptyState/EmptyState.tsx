import { Stack, Text, Button, Center, Box } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

export function EmptyState({
  message = 'No data found',
  description = 'Get started by adding your first item',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <Center py={60}>
      <Stack align="center" gap="md">
        <Box c="gray.5">{icon || <IconInbox size={50} stroke={1.5} />}</Box>

        <Stack gap={4} align="center">
          <Text size="lg" fw={500} c="gray.7">
            {message}
          </Text>
          <Text size="sm" c="gray.6">
            {description}
          </Text>
        </Stack>

        {action && (
          <Button onClick={action.onClick} variant="default" mt="xs">
            {action.label}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
