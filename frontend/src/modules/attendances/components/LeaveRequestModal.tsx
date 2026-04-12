import { useState } from 'react';
import { Modal, Stack, Group, Text, Badge, Button, Divider } from '@mantine/core';
import { IconCalendar, IconUser, IconFileText, IconClock, IconEdit } from '@tabler/icons-react';
import type { ILeaveRequest } from '../types';
import { useUpdateLeaveRequest as useUpdateStatus } from '../api/update-leave-request';
import { LEAVE_TYPE_LABEL, formatDate, minutesToTime } from '@/constant';
import { LEAVE_STATUS_COLOR } from '../utils/color';
import type { ILeaveRequest as ILeaveRequestFull } from '@/modules/leave-requests/types';
import { LeaveRequestFormModal } from '@/modules/leave-requests/components/LeaveRequestFormModal';
import { useUpdateLeaveRequest } from '@/modules/leave-requests/api/update-leave-request';
import { notify } from '@/components/Notification';

interface Props {
  opened: boolean;
  onClose: () => void;
  leaveRequest: ILeaveRequest | null;
  employeeName?: string;
  /** 'admin' shows approve/reject, 'employee' shows edit (only when pending) */
  mode?: 'admin' | 'employee';
}

export function LeaveRequestModal({
  opened,
  onClose,
  leaveRequest,
  employeeName,
  mode = 'admin',
}: Props) {
  const { mutate: updateStatus, isPending } = useUpdateStatus();
  const updateMutation = useUpdateLeaveRequest();
  const [editOpened, setEditOpened] = useState(false);

  if (!leaveRequest) return null;

  const isPending_ = leaveRequest.status === 'pending';
  const canEdit = mode === 'employee' && isPending_;

  const handleAction = (status: 'approved' | 'rejected') => {
    updateStatus({ id: leaveRequest.id, status }, { onSuccess: onClose });
  };

  const handleEditSubmit = async (payload: any, id?: string) => {
    const notiId = notify.loading('Updating...');
    try {
      await updateMutation.mutateAsync({ id: id!, ...payload });
      notify.success(notiId, { message: 'Leave request updated' });
      setEditOpened(false);
      onClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Failed to update' });
    }
  };

  const title =
    mode === 'employee'
      ? isPending_
        ? 'My Leave Request'
        : 'Leave Request Detail'
      : 'Leave Request Detail';

  return (
    <>
      <Modal opened={opened} onClose={onClose} title={title} centered size="md">
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

          {(leaveRequest.leave_start_minutes != null || leaveRequest.leave_end_minutes != null) && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Time
              </Text>
              <Group gap="xs">
                <IconClock size={14} />
                <Text size="sm">
                  {leaveRequest.leave_start_minutes != null
                    ? minutesToTime(leaveRequest.leave_start_minutes)
                    : '—'}
                  {' – '}
                  {leaveRequest.leave_end_minutes != null
                    ? minutesToTime(leaveRequest.leave_end_minutes)
                    : '—'}
                </Text>
              </Group>
            </Group>
          )}

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
              Status
            </Text>
            <Badge variant="light" color={LEAVE_STATUS_COLOR[leaveRequest.status] ?? 'gray'}>
              {leaveRequest.status}
            </Badge>
          </Group>

          <Divider />

          {mode === 'admin' && (
            <>
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
            </>
          )}

          {mode === 'employee' && (
            <Group justify="flex-end">
              {canEdit ? (
                <Button leftSection={<IconEdit size={14} />} onClick={() => setEditOpened(true)}>
                  Edit Request
                </Button>
              ) : (
                <Text size="xs" c="dimmed">
                  This request has been {leaveRequest.status} and cannot be edited.
                </Text>
              )}
            </Group>
          )}
        </Stack>
      </Modal>

      <LeaveRequestFormModal
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        mode="edit"
        initialValues={leaveRequest as unknown as ILeaveRequestFull}
        onSubmit={handleEditSubmit}
        loading={updateMutation.isPending}
      />
    </>
  );
}
