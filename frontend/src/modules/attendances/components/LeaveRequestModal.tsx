import { Modal, Stack, Group, Text, Badge, Button, Divider } from '@mantine/core';
import { IconCalendar, IconUser, IconFileText } from '@tabler/icons-react';
import type { ILeaveRequest } from '../types';
import { useUpdateLeaveRequest } from '../api/update-leave-request';
import { LEAVE_TYPE_LABEL, formatDate } from '@/constant';
import { LEAVE_STATUS_COLOR } from '../utils/color';

interface Props {
  opened: boolean;
  onClose: () => void;
  leaveRequest: ILeaveRequest | null;
  employeeName?: string;
}

export function LeaveRequestModal({ opened, onClose, leaveRequest, employeeName }: Props) {
  const { mutate: updateStatus, isPending } = useUpdateLeaveRequest();

  if (!leaveRequest) return null;

  const handleAction = (status: 'approved' | 'rejected') => {
    updateStatus({ id: leaveRequest.id, status }, { onSuccess: onClose });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Leave Request Detail" centered size="md">
      <Stack gap="md">
        {employeeName && (
          <Group gap="xs">
            <IconUser size={16} />
            <Text fw={500}>{employeeName}</Text>
          </Group>
        )}

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Leave Type
          </Text>
          <Badge variant="light" color="blue">
            {LEAVE_TYPE_LABEL[leaveRequest.leave_type] ?? leaveRequest.leave_type}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Period
          </Text>
          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="sm">
              {formatDate(leaveRequest.start_date)} – {formatDate(leaveRequest.end_date)}
            </Text>
          </Group>
        </Group>

        {leaveRequest.reason && (
          <Group justify="space-between" align="flex-start">
            <Group gap="xs">
              <IconFileText size={14} />
              <Text size="sm" c="dimmed">
                Reason
              </Text>
            </Group>
            <Text size="sm" maw={260} ta="right">
              {leaveRequest.reason}
            </Text>
          </Group>
        )}

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Manager Status
          </Text>
          <Badge variant="light" color={LEAVE_STATUS_COLOR[leaveRequest.status] ?? 'gray'}>
            {leaveRequest.status}
          </Badge>
        </Group>

        <Divider />

        <Text size="sm" c="dimmed">
          Admin Action
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="red"
            loading={isPending}
            onClick={() => handleAction('rejected')}
            disabled={leaveRequest.status === 'rejected'}
          >
            Reject
          </Button>
          <Button
            color="green"
            loading={isPending}
            onClick={() => handleAction('approved')}
            disabled={leaveRequest.status === 'approved'}
          >
            Approve
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
