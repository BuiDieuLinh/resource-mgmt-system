import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
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
  IconChecks,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { TablePagination } from '@/components/Pagination';
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
import { useConfirm } from '@/hooks/useConfirm';
import { useGetLeaveRequests } from '../api/get-leave-requests';
import { useCreateLeaveRequest } from '../api/create-leave-request';
import { useUpdateLeaveStatus } from '../api/update-leave-status';
import { useDeleteLeaveRequest } from '../api/delete-leave-request';
import { useBulkUpdateLeaveStatus } from '../api/bulk-update-status';
import { LeaveRequestFormModal } from '../components/LeaveRequestFormModal';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { useHasRole } from '@/hooks/useHasRole';
import { STATUS_COLOR } from '../utils';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useGetAllDepartments } from '@/modules/departments/api/get-departments';
import { EmployeeColumn } from '@/components/EmployeeColumn/EmployeeColumn';
import MonthNavigator from '@/modules/attendances/components/MonthPickerInput';
import {
  FilterTreeSelect,
  type CombinedFilterItem,
} from '@/components/FilterTreeSelect/FilterTreeSelect';

export default function LeaveRequestsPage() {
  const [filterSelect, setFilterSelect] = useState<CombinedFilterItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() => new Date());
  const [page, setPage] = useState(1);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState(false);
  const [editRequest, setEditRequest] = useState<ILeaveRequest | null>(null);
  const isAdmin = useHasRole(EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR);
  const isManager = useHasRole(EMPLOYEE_ROLE.MANAGER);

  const { confirm, ConfirmComponent } = useConfirm();

  const { data: currentEmpData } = useGetEmployeeByUserId();
  const currentEmployeeId = currentEmpData?.data?.id;

  const [actionModal, setActionModal] = useState<{
    ids: string[];
    status: 'approved' | 'rejected';
  } | null>(null);
  const [actionComment, setActionComment] = useState('');

  const selectedStatusIds = filterSelect
    .filter((item) => item.type === 'status')
    .map((item) => item.value);
  const selectedEmployeeIds = filterSelect
    .filter((item) => item.type === 'employee')
    .map((item) => item.value);
  const selectedDepartmentIds = filterSelect
    .filter((item) => item.type === 'department')
    .map((item) => item.value);

  const month = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1;
  const year = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();

  const {
    data: leaveData,
    isLoading: _loading,
    error,
    refetch,
  } = useGetLeaveRequests({
    status: selectedStatusIds.length ? selectedStatusIds.join(',') : undefined,
    employee_id: selectedEmployeeIds.length ? selectedEmployeeIds.join(',') : undefined,
    department_id: selectedDepartmentIds.length ? selectedDepartmentIds.join(',') : undefined,
    month,
    year,
    pageIndex: page,
    pageSize: 10,
  });
  const isLoading = useDelayedLoading(_loading);
  const requests = leaveData?.data ?? [];
  const total = leaveData?.count ?? 0;

  const isEmployeeOnly = !isAdmin && !isManager;

  const { data: empData } = useGetEmployees(
    {
      pageIndex: 1,
      // Don't pass pageSize - backend will return all employees for filter search
    },
    {
      enabled: !isEmployeeOnly,
    },
  );
  const employeeOptions = useMemo(
    () =>
      isEmployeeOnly
        ? []
        : (empData?.data ?? []).map((e) => ({
            value: e.id,
            label: `${e.full_name} (${e.employee_code})`,
          })),
    [empData, isEmployeeOnly],
  );

  const { data: deptData, isLoading: isDeptLoading } = useGetAllDepartments();

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveStatus();
  const deleteMutation = useDeleteLeaveRequest();
  const bulkMutation = useBulkUpdateLeaveStatus();

  const isEdit = Boolean(editRequest);

  const selectableIndices = useMemo(() => {
    return requests
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => {
        if (r.status !== LEAVE_STATUS.PENDING) return false;
        if (r.employee_id === currentEmployeeId) return false;
        if (isAdmin && !r.approved_by_admin) return true;
        if (isManager && !isAdmin && !r.approved_by_manager && !r.approved_by_admin) return true;
        return false;
      })
      .map(({ i }) => i);
  }, [requests, currentEmployeeId, isAdmin, isManager]);

  const someSelected = selectedIndices.size > 0;

  const getSelectedRequests = () =>
    Array.from(selectedIndices)
      .map((i) => requests[i])
      .filter(Boolean);

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
      notify.success(notiId, { message: isEdit ? 'Updated' : 'Submitted' });
      handleClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Failed' });
    }
  };

  const handleStatus = (id: string, status: 'approved' | 'rejected') => {
    setActionComment('');
    setActionModal({ ids: [id], status });
  };

  const handleBulkAction = (status: 'approved' | 'rejected') => {
    setActionComment('');
    const ids = getSelectedRequests().map((r) => r.id);
    setActionModal({ ids, status });
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { ids, status } = actionModal;
    const isBulk = ids.length > 1;
    const notiId = notify.loading(
      status === LEAVE_STATUS.APPROVED ? 'Approving...' : 'Rejecting...',
    );
    try {
      if (isBulk) {
        await bulkMutation.mutateAsync({ ids, status, comment: actionComment.trim() || undefined });
        setSelectedIndices(new Set());
      } else {
        await updateMutation.mutateAsync({
          id: ids[0],
          status,
          comment: actionComment.trim() || undefined,
        });
      }
      notify.success(notiId, {
        message: `${isBulk ? `${ids.length} requests` : 'Leave request'} ${status}`,
      });
      setActionModal(null);
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Action failed' });
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: 'Delete Leave Request',
      message: 'Are you sure you want to delete this leave request? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading('Deleting...');
        try {
          await deleteMutation.mutateAsync(id);
          notify.success(notiId, { message: 'Deleted' });
        } catch (e: any) {
          notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
        }
      },
    });
  };

  const columns: TableColumn<ILeaveRequest>[] = [
    {
      key: 'employee',
      title: 'Employee',
      sortable: true,
      render: (r) => (
        <EmployeeColumn employee={r.employee} showAvatar={true} showPendingBadge={false} />
      ),
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
      key: 'approved_by',
      title: 'Review',
      render: (r) => (
        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <ThemeIcon
              size={18}
              radius="xl"
              variant="light"
              color={r.approved_by_manager ? 'green' : 'gray'}
            >
              <IconUser size={10} />
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
          <Group gap={6} wrap="nowrap">
            <ThemeIcon
              size={18}
              radius="xl"
              variant="light"
              color={r.approved_by_admin ? 'green' : 'gray'}
            >
              <IconShieldCheck size={10} />
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
          <Group gap="sm" wrap="wrap" align="center">
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpen}>
              Add Leave Request
            </Button>
            <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />

            {!isEmployeeOnly && (
              <FilterTreeSelect
                value={filterSelect}
                onChange={(value) => {
                  setFilterSelect(value);
                  setPage(1);
                }}
                w={isAdmin ? 280 : 200}
                employeeOptions={isManager && !isAdmin ? [] : employeeOptions}
                departments={isManager && !isAdmin ? [] : (deptData?.data ?? [])}
                statusOptions={LEAVE_STATUS_OPTIONS}
                isLoading={_loading || isDeptLoading}
              />
            )}

            {someSelected && (
              <Group gap={6}>
                <Text size="sm" c="dimmed">
                  {selectedIndices.size} selected
                </Text>
                <Button
                  size="xs"
                  color="green"
                  leftSection={<IconChecks size={14} />}
                  onClick={() => handleBulkAction(LEAVE_STATUS.APPROVED)}
                >
                  Approve all
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  leftSection={<IconX size={14} />}
                  onClick={() => handleBulkAction(LEAVE_STATUS.REJECTED)}
                >
                  Reject all
                </Button>
              </Group>
            )}
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[160, 100, 160, 200, 180, 90, 100]} />
      ) : (
        <BaseTable
          data={requests}
          columns={columns}
          height={480}
          withCheckbox
          selectedRows={selectedIndices}
          onSelectionChange={(indices) => {
            const filtered = new Set(
              Array.from(indices).filter((i) => selectableIndices.includes(i)),
            );
            setSelectedIndices(filtered);
          }}
        />
      )}

      <TablePagination
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />

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
              {actionModal?.status === LEAVE_STATUS.APPROVED ? 'Approve' : 'Reject'}{' '}
              {(actionModal?.ids.length ?? 0) > 1
                ? `${actionModal?.ids.length} Requests`
                : 'Leave Request'}
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
              ? 'Optionally leave a note for the employee(s).'
              : 'Please provide a reason for rejection.'}
          </Text>
          <Textarea
            label="Comment"
            placeholder={
              actionModal?.status === LEAVE_STATUS.APPROVED
                ? 'e.g. Approved!'
                : 'e.g. Insufficient notice...'
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
              loading={updateMutation.isPending || bulkMutation.isPending}
              onClick={handleConfirmAction}
            >
              {actionModal?.status === LEAVE_STATUS.APPROVED ? 'Approve' : 'Reject'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmComponent />
    </Stack>
  );
}
