import { Modal, Button, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface BaseFormModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  loading?: boolean;
}

export function BaseFormModal({
  opened,
  onClose,
  title,
  children,
  loading = false,
}: BaseFormModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size='lg'>{title}</Text>
      }
      centered
      size="lg"
      overlayProps={{ blur: 3 }}
    >
      {children}

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save
        </Button>
      </Group>
    </Modal>
  );
}
