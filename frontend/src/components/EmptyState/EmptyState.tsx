import { Stack, Text, Button, Center, Box } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

export function EmptyState({ message, description, action, icon }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <Center py={60}>
      <Stack align="center" gap="md">
        <Box c="gray.5">{icon || <IconInbox size={50} stroke={1.5} />}</Box>

        <Stack gap={4} align="center">
          <Text size="lg" fw={500} c="gray.7">
            {message ?? t('emptyState.noDataFound')}
          </Text>
          <Text size="sm" c="gray.6">
            {description ?? t('emptyState.getStarted')}
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
