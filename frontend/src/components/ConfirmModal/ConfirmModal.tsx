import { Modal, Button, Group, Text, Stack } from '@mantine/core';

export type ConfirmType = 'delete' | 'warning' | 'info' | 'danger';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmType;
  loading?: boolean;
}

const typeConfig = {
  delete: {
    color: 'red',
    confirmColor: 'red',
  },
  warning: {
    color: 'yellow',
    confirmColor: 'yellow',
  },
  info: {
    color: 'blue',
    confirmColor: 'blue',
  },
  danger: {
    color: 'red',
    confirmColor: 'red',
  },
};

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
  loading = false,
}: ConfirmModalProps) {
  const config = typeConfig[type];

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600} size="lg">
            {title}
          </Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {message}
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button color={config.confirmColor} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
