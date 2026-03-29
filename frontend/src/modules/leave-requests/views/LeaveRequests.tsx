import { useState, useMemo } from 'react';
import { Stack, Group, Button, Badge, Select, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { notify } from '@/components/Notification';
import ErrorState from '@/components/ErrorState/ErrorState';
import { formatDate, LEAVE_TYPE_LABEL, LEAVE_STATUS_LABEL } from '@/constant';
import { TableSkeleton } from '@/components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useGetLeaveRequests } from '../api/get-leave-requests';
import { useCreateLeaveRequest } from '../api/create-leave-request';
import { useUpdateLeaveStatus } from '../api/update-leave-status';
import { useDeleteLeaveRequest } from '../api/delete-leave-request';
import { LeaveRequestFormModal } from '../components/LeaveRequestFormModal';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';
import { useGetEmployees } from '@/modules/employees/api/get-employees';

const STATUS_COLOR: Record<string, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

export default function LeaveRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [editRequest, setEditRequest] = useState<ILeaveRequest | null>(null);

  const {
    data: leaveData,
    isLoading: _loading,
    error,
    refetch,
  } = useGetLeaveRequests({
    status: filterStatus ?? undefined,
    employee_id: filterEmployee ?? undefined,
  });
  const isLoading = useDelayedLoading(_loading);
  const requests = leaveData?.data ?? [];

  const { data: empData } = useGetEmployees({ pageIndex: 1, pageSize: 999 });
  const employeeOptions = useMemo(
    () =>
      (empData?.data ?? []).map((e) => ({
        value: e.id,
        label: `${e.full_name} (${e.employee_code})`,
      })),
    [empData],
  );

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveStatus();
  const deleteMutation = useDeleteLeaveRequest();

  const isEdit = Boolean(editRequest);

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
    const notiId = notify.loading(isEdit ? 'Updating...' : 'Submitting...');
    try {
      await createMutation.mutateAsync(payload);
      notify.success(notiId, {
        message: isEdit ? 'Leave request updated' : 'Leave request submitted',
      });
      handleClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Failed to submit' });
    }
  };

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    const notiId = notify.loading(status === 'approved' ? 'Approving...' : 'Rejecting...');
    try {
      await updateMutation.mutateAsync({ id, status });
      notify.success(notiId, { message: `Leave request ${status}` });
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Action failed' });
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
      key: 'employee',
      title: 'Employee',
      sortable: true,
      render: (r) => r.employee?.full_name ?? r.employee_id,
    },
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
      key: 'start_date',
      title: 'Start',
      sortable: true,
      render: (r) => formatDate(r.start_date),
    },
    {
      key: 'end_date',
      title: 'End',
      sortable: true,
      render: (r) => formatDate(r.end_date),
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
      render: (r) => (
        <Group gap={4} justify="center">
          {r.status === 'pending' && (
            <>
              <Tooltip label="Approve" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="green"
                  onClick={() => handleStatus(r.id, 'approved')}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reject" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => handleStatus(r.id, 'rejected')}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleEdit(r)}>
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          <Tooltip label="Delete" withArrow>
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(r.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <Stack gap="md">
      <PageHeader
        title="Leave Requests"
        description="Manage employee leave requests"
        right={
          <Group>
            <Select
              checkIconPosition="right"
              placeholder="Filter employee"
              clearable
              searchable
              w={200}
              data={employeeOptions}
              value={filterEmployee}
              onChange={setFilterEmployee}
            />
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
            <Button leftSection={<IconPlus size={16} />} onClick={handleOpen}>
              New Request
            </Button>
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[160, 100, 110, 110, 200, 90, 100]} />
      ) : (
        <BaseTable data={requests} columns={columns} height={520} />
      )}

      <LeaveRequestFormModal
        opened={opened}
        onClose={handleClose}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={editRequest}
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
      />
    </Stack>
  );
}
