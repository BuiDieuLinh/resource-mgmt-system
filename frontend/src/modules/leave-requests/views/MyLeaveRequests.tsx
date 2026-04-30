import { useState } from 'react';
import { Stack, Group, Button, Badge, Select, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { notify } from '@/components/Notification';
import ErrorState from '@/components/ErrorState/ErrorState';
import { formatDate, LEAVE_TYPE_LABEL, LEAVE_STATUS_LABEL, minutesToTime } from '@/constant';
import { TableSkeleton } from '@/components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useGetMyLeaveRequests } from '../api/get-my-leave-requests';
import { useCreateLeaveRequest } from '../api/create-leave-request';
import { useDeleteLeaveRequest } from '../api/delete-leave-request';
import { LeaveRequestFormModal } from '../components/LeaveRequestFormModal';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';

const STATUS_COLOR: Record<string, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

export default function MyLeaveRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [editRequest, setEditRequest] = useState<ILeaveRequest | null>(null);

  const {
    data,
    isLoading: _loading,
    error,
    refetch,
  } = useGetMyLeaveRequests(filterStatus ?? undefined);
  const isLoading = useDelayedLoading(_loading);
  const requests = data?.data ?? [];

  const createMutation = useCreateLeaveRequest();
  const deleteMutation = useDeleteLeaveRequest();

  const handleOpen = () => {
    setEditRequest(null);
    setOpened(true);
  };
  const handleEdit = (r: ILeaveRequest) => {
    setEditRequest(r);
    setOpened(true);
  };
  const handleClose = () => {
    setOpened(false);
    setEditRequest(null);
  };

  const handleSubmit = async (payload: ILeaveRequestPayload) => {
    const notiId = notify.loading('Submitting...');
    try {
      await createMutation.mutateAsync(payload);
      notify.success(notiId, { message: 'Leave request submitted' });
      handleClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Failed to submit' });
    }
  };

  const handleDelete = async (id: string) => {
    const notiId = notify.loading('Deleting...');
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(notiId, { message: 'Deleted' });
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
    }
  };

  const columns: TableColumn<ILeaveRequest>[] = [
    {
      key: 'leave_type',
      title: 'Type',
      render: (r) => (
        <Badge variant="light" color="blue" size="sm">
          {LEAVE_TYPE_LABEL[r.leave_type] ?? r.leave_type}
        </Badge>
      ),
    },
    {
      key: 'period',
      title: 'Period',
      render: (r) => {
        const timeLabel =
          r.leave_start_minutes != null || r.leave_end_minutes != null
            ? `${r.leave_start_minutes != null ? minutesToTime(r.leave_start_minutes) : '—'} – ${r.leave_end_minutes != null ? minutesToTime(r.leave_end_minutes) : '—'}`
            : 'Full day';
        return (
          <Stack gap={1}>
            <Text size="sm">
              {formatDate(r.start_date)} – {formatDate(r.end_date)}
            </Text>
            <Text size="xs" c="dimmed">
              {timeLabel}
            </Text>
          </Stack>
        );
      },
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (r) => (
        <Text size="sm" c="dimmed" lineClamp={1}>
          {r.reason || '—'}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (r) => (
        <Badge variant="light" color={STATUS_COLOR[r.status] ?? 'gray'} size="sm">
          {LEAVE_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'center',
      render: (r) =>
        r.status === 'pending' ? (
          <Group gap={4} justify="center">
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleEdit(r)}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(r.id)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : null,
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <Stack gap="md">
      <PageHeader
        title="My Leave Requests"
        description="View and manage your leave requests"
        right={
          <Group>
            <Select
              checkIconPosition="right"
              placeholder="Filter status"
              clearable
              w={130}
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
            />
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpen}>
              New Request
            </Button>
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[100, 110, 110, 150, 200, 100, 80]} />
      ) : (
        <BaseTable data={requests} columns={columns} height={520} />
      )}

      <LeaveRequestFormModal
        opened={opened}
        onClose={handleClose}
        mode={editRequest ? 'edit' : 'add'}
        initialValues={editRequest}
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
      />
    </Stack>
  );
}
