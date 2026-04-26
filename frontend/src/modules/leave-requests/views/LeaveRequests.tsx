import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
  Select,
  Text,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  ThemeIcon,
  Divider,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconUser,
  IconShieldCheck,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { notify } from '@/components/Notification';
import ErrorState from '@/components/ErrorState/ErrorState';
import {
  formatDate,
  LEAVE_TYPE_LABEL,
  LEAVE_STATUS_LABEL,
  minutesToTime,
  LEAVE_STATUS,
  EMPLOYEE_ROLE,
  LEAVE_STATUS_OPTIONS,
} from '@/constant';
import { TableSkeleton } from '@/components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useGetLeaveRequests } from '../api/get-leave-requests';
import { useCreateLeaveRequest } from '../api/create-leave-request';
import { useUpdateLeaveStatus } from '../api/update-leave-status';
import { useDeleteLeaveRequest } from '../api/delete-leave-request';
import { LeaveRequestFormModal } from '../components/LeaveRequestFormModal';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { useHasRole } from '@/hooks/useHasRole';
import { STATUS_COLOR } from '../utils';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';

export default function LeaveRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [editRequest, setEditRequest] = useState<ILeaveRequest | null>(null);
  const isAdmin = useHasRole(EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN);
  const isManager = useHasRole(EMPLOYEE_ROLE.MANAGER);

  const { user } = useAuth();
  const { data: currentEmpData } = useGetEmployeeByUserId(user?.id);
  const currentEmployeeId = currentEmpData?.data?.id;

  const [actionModal, setActionModal] = useState<{
    id: string;
    status: 'approved' | 'rejected';
  } | null>(null);
  const [actionComment, setActionComment] = useState('');

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
    setActionComment('');
    setActionModal({ id, status });
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { id, status } = actionModal;
    const notiId = notify.loading(
      status === LEAVE_STATUS.APPROVED ? 'Approving...' : 'Rejecting...',
    );
    try {
      await updateMutation.mutateAsync({ id, status, comment: actionComment.trim() || undefined });
      notify.success(notiId, { message: `Leave request ${status}` });
      setActionModal(null);
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
        <Badge variant="light" color="blue" size="sm" fw={500}>
          {LEAVE_TYPE_LABEL[r.leave_type] ?? r.leave_type}
        </Badge>
      ),
    },
    {
      key: 'period',
      title: 'Time Period',
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
      key: 'approved_by',
      title: 'Review',
      render: (r) => (
        <Stack gap={6}>
          {/* Manager row */}
          <Group gap={6} wrap="nowrap">
            <ThemeIcon
              size={20}
              radius="xl"
              variant="light"
              color={r.approved_by_manager ? 'green' : 'gray'}
            >
              <IconUser size={11} />
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c={r.approved_by_manager ? 'green' : 'dimmed'} fw={500} truncate>
                {r.approver_manager?.full_name ?? 'Manager —'}
              </Text>
              {r.manager_comment && (
                <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>
                  {r.manager_comment}
                </Text>
              )}
            </Box>
          </Group>

          <Divider />

          {/* Admin row */}
          <Group gap={6} wrap="nowrap">
            <ThemeIcon
              size={20}
              radius="xl"
              variant="light"
              color={r.approved_by_admin ? 'green' : 'gray'}
            >
              <IconShieldCheck size={11} />
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c={r.approved_by_admin ? 'green' : 'dimmed'} fw={500} truncate>
                {r.approver_admin?.full_name ?? 'Admin —'}
              </Text>
              {r.admin_comment && (
                <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>
                  {r.admin_comment}
                </Text>
              )}
            </Box>
          </Group>
        </Stack>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (r) => (
        <Badge variant="light" color={STATUS_COLOR[r.status] ?? 'gray'} size="sm" fw={500}>
          {LEAVE_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'center',
      render: (r) => {
        const isSelf = currentEmployeeId === r.employee_id;
        const isPending = r.status === LEAVE_STATUS.PENDING;

        const adminCanAct = isAdmin && isPending && !r.approved_by_admin && !isSelf;
        const managerCanAct =
          isManager &&
          !isAdmin &&
          isPending &&
          !r.approved_by_manager &&
          !r.approved_by_admin &&
          !isSelf;

        const canAct = adminCanAct || managerCanAct;

        return (
          <Group gap={4} justify="center">
            {canAct && (
              <>
                <Tooltip label="Approve" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="green"
                    onClick={() => handleStatus(r.id, LEAVE_STATUS.APPROVED)}
                  >
                    <IconCheck size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Reject" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => handleStatus(r.id, LEAVE_STATUS.REJECTED)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
            {isPending && isSelf && (
              <>
                <Tooltip label="Edit" withArrow>
                  <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleEdit(r)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(r.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        );
      },
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
              data={LEAVE_STATUS_OPTIONS}
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
        <TableSkeleton colWidths={[160, 100, 110, 110, 200, 90, 100]} />
      ) : (
        <BaseTable data={requests} columns={columns} height={520} withCheckbox={true} />
      )}

      <LeaveRequestFormModal
        opened={opened}
        onClose={handleClose}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={editRequest}
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
      />

      <Modal
        opened={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          <Group gap="xs">
            <ThemeIcon
              size={28}
              radius="xl"
              color={actionModal?.status === LEAVE_STATUS.APPROVED ? 'green' : 'red'}
              variant="light"
            >
              {actionModal?.status === LEAVE_STATUS.APPROVED ? (
                <IconCheck size={15} />
              ) : (
                <IconX size={15} />
              )}
            </ThemeIcon>
            <Text fw={700} size="md">
              {actionModal?.status === LEAVE_STATUS.APPROVED
                ? 'Approve Leave Request'
                : 'Reject Leave Request'}
            </Text>
          </Group>
        }
        centered
        size="sm"
        styles={{ header: { paddingBottom: 8 } }}
      >
        <Divider mb="md" />
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {actionModal?.status === LEAVE_STATUS.APPROVED
              ? 'You can optionally leave a note for the employee.'
              : 'Please provide a reason so the employee knows what to improve.'}
          </Text>
          <Textarea
            label="Comment"
            placeholder={
              actionModal?.status === LEAVE_STATUS.APPROVED
                ? 'e.g. Approved, enjoy your leave!'
                : 'e.g. Insufficient notice period...'
            }
            autosize
            minRows={3}
            value={actionComment}
            onChange={(e) => setActionComment(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt={4}>
            <Button variant="subtle" color="gray" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              color={actionModal?.status === LEAVE_STATUS.APPROVED ? 'green' : 'red'}
              leftSection={
                actionModal?.status === LEAVE_STATUS.APPROVED ? (
                  <IconCheck size={15} />
                ) : (
                  <IconX size={15} />
                )
              }
              loading={updateMutation.isPending}
              onClick={handleConfirmAction}
            >
              {actionModal?.status === LEAVE_STATUS.APPROVED ? 'Approve' : 'Reject'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
