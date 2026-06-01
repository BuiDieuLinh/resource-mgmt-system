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
  MultiSelect,
  Paper,
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
  IconFilter,
  IconFilterOff,
  IconUserCheck,
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
  LEAVE_TYPE_OPTIONS,
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
import { useTranslation } from 'react-i18next';

export default function LeaveRequestsPage() {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() => new Date());
  const [page, setPage] = useState(1);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState(false);
  const [editRequest, setEditRequest] = useState<ILeaveRequest | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ILeaveRequest | null>(null);
  const isAdmin = useHasRole(EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR);
  const isManager = useHasRole(EMPLOYEE_ROLE.MANAGER);

  const [showMyRequests, setShowMyRequests] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const { confirm, ConfirmComponent } = useConfirm();

  const { data: currentEmpData } = useGetEmployeeByUserId();
  const currentEmployeeId = currentEmpData?.data?.id;

  const [actionModal, setActionModal] = useState<{
    ids: string[];
    status: 'approved' | 'rejected';
  } | null>(null);
  const [actionComment, setActionComment] = useState('');

  const month = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1;
  const year = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();

  const isEmployeeOnly = !isAdmin && !isManager;

  const employeeIdFilter = useMemo(() => {
    if (isEmployeeOnly) {
      return currentEmployeeId ? [currentEmployeeId] : undefined;
    }
    if (showMyRequests && currentEmployeeId) {
      return [currentEmployeeId];
    }
    if (selectedEmployees.length > 0) {
      return selectedEmployees;
    }
    return undefined;
  }, [isEmployeeOnly, showMyRequests, currentEmployeeId, selectedEmployees]);

  const {
    data: leaveData,
    isLoading: _loading,
    error,
    refetch,
  } = useGetLeaveRequests({
    status: selectedStatuses.length ? selectedStatuses.join(',') : undefined,
    employee_id: employeeIdFilter ? employeeIdFilter.join(',') : undefined,
    department_id: selectedDepartments.length ? selectedDepartments.join(',') : undefined,
    leave_type: selectedLeaveTypes.length ? selectedLeaveTypes.join(',') : undefined,
    month,
    year,
    pageIndex: page,
    pageSize: 10,
  });
  const isLoading = useDelayedLoading(_loading);
  const requests = leaveData?.data ?? [];
  const total = leaveData?.count ?? 0;

  const { data: empData } = useGetEmployees(
    {
      pageIndex: 1,
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

  const { data: deptData } = useGetAllDepartments({
    enabled: isAdmin && !isEmployeeOnly,
  });

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

  const handleCloseReview = () => {
    setReviewRequest(null);
  };

  const handleSubmit = async (payload: ILeaveRequestPayload) => {
    const notiId = notify.loading(
      isEdit ? t('leaveRequest.updatingRequest') : t('leaveRequest.submittingRequest'),
    );
    try {
      await createMutation.mutateAsync(payload);
      notify.success(notiId, {
        message: isEdit ? t('leaveRequest.updated') : t('leaveRequest.submitted'),
      });
      handleClose();
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || t('leaveRequest.failed') });
    }
  };

  const handleStatus = (id: string) => {
    const request = requests.find((item) => item.id === id);
    if (!request) return;
    setReviewRequest(request);
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
      status === LEAVE_STATUS.APPROVED ? t('leaveRequest.approving') : t('leaveRequest.rejecting'),
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
        message: t('leaveRequest.actionSuccess', {
          target: isBulk
            ? t('leaveRequest.requestsCount', { count: ids.length })
            : t('leaveRequest.singleRequest'),
          status:
            status === LEAVE_STATUS.APPROVED
              ? t('labels.leaveStatus.approved')
              : t('labels.leaveStatus.rejected'),
        }),
      });
      setActionModal(null);
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || t('leaveRequest.actionFailed'),
      });
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('leaveRequest.deleteTitle'),
      message: t('leaveRequest.deleteMessage'),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('common.cancel'),
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading(t('leaveRequest.deleting'));
        try {
          await deleteMutation.mutateAsync(id);
          notify.success(notiId, { message: t('leaveRequest.deleted') });
        } catch (e: any) {
          notify.error(notiId, {
            message: e?.response?.data?.message || t('leaveRequest.deleteFailed'),
          });
        }
      },
    });
  };

  const columns: TableColumn<ILeaveRequest>[] = [
    {
      key: 'employee',
      title: t('employee.employee'),
      sortable: true,
      render: (r) => (
        <EmployeeColumn employee={r.employee} showAvatar={true} showPendingBadge={false} />
      ),
    },
    {
      key: 'leave_type',
      title: t('common.type'),
      render: (r) => (
        <Badge variant="light" color="blue" size="sm" fw={500}>
          {LEAVE_TYPE_LABEL[r.leave_type] ?? r.leave_type}
        </Badge>
      ),
    },
    {
      key: 'period',
      title: t('common.period'),
      render: (r) => {
        const timeLabel =
          r.leave_start_minutes != null || r.leave_end_minutes != null
            ? `${r.leave_start_minutes != null ? minutesToTime(r.leave_start_minutes) : '—'} – ${r.leave_end_minutes != null ? minutesToTime(r.leave_end_minutes) : '—'}`
            : t('leaveRequest.fullDay');
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
      title: t('leaveRequest.reason'),
      render: (r) => (
        <Text size="sm" c="dimmed" lineClamp={1}>
          {r.reason || t('common.notAvailable')}
        </Text>
      ),
    },
    {
      key: 'approved_by',
      title: t('leaveRequest.review'),
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
                {r.approver_manager?.full_name ?? t('leaveRequest.managerFallback')}
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
                {r.approver_admin?.full_name ?? t('leaveRequest.adminFallback')}
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
      title: t('common.status'),
      align: 'center',
      render: (r) => (
        <Badge variant="light" color={STATUS_COLOR[r.status] ?? 'gray'} size="sm" fw={500}>
          {LEAVE_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: t('actions.actions'),
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
        const managerApproved = !!r.approved_by_manager;
        return (
          <Group gap={4} justify="center">
            {canAct && (
              <>
                <Tooltip label={t('common.approve')} withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="green"
                    onClick={() => handleStatus(r.id)}
                  >
                    <IconCheck size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('common.reject')} withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => handleStatus(r.id)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
            {isPending && isSelf && !managerApproved && (
              <>
                <Tooltip label={t('common.edit')} withArrow>
                  <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleEdit(r)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('common.delete')} withArrow>
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

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedLeaveTypes.length > 0 ||
    selectedEmployees.length > 0 ||
    selectedDepartments.length > 0 ||
    showMyRequests;

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSelectedLeaveTypes([]);
    setSelectedEmployees([]);
    setSelectedDepartments([]);
    if (showMyRequests) {
      setShowMyRequests(false);
    }
    setPage(1);
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <Stack gap="md">
      <PageHeader
        title={t('pages.leaveRequestsTitle')}
        description={t('pages.leaveRequestsDescription')}
        right={
          <Group gap="sm">
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpen}>
              {t('leaveRequest.addRequest')}
            </Button>
          </Group>
        }
      />

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap" align="center">
            <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />

            <Tooltip
              label={
                selectedStatuses.length > 0
                  ? selectedStatuses
                      .map((s) => LEAVE_STATUS_LABEL[s as keyof typeof LEAVE_STATUS_LABEL])
                      .join(', ')
                  : ''
              }
              disabled={selectedStatuses.length === 0}
              multiline
              w={200}
            >
              <Box>
                <MultiSelect
                  placeholder={t('leaveRequest.filters.status')}
                  data={LEAVE_STATUS_OPTIONS}
                  value={selectedStatuses}
                  onChange={(value) => {
                    setSelectedStatuses(value);
                    setPage(1);
                  }}
                  clearable
                  searchable
                  w={160}
                  size="sm"
                  leftSection={<IconFilter size={16} />}
                  hidePickedOptions
                  styles={{
                    input: {
                      minHeight: 36,
                      maxHeight: 36,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollbarWidth: 'thin',
                    },
                    pill: {
                      flexShrink: 0,
                    },
                  }}
                />
              </Box>
            </Tooltip>

            <Tooltip
              label={
                selectedLeaveTypes.length > 0
                  ? selectedLeaveTypes
                      .map((t) => LEAVE_TYPE_LABEL[t as keyof typeof LEAVE_TYPE_LABEL])
                      .join(', ')
                  : ''
              }
              disabled={selectedLeaveTypes.length === 0}
              multiline
              w={220}
            >
              <Box>
                <MultiSelect
                  placeholder={t('leaveRequest.filters.leaveType')}
                  data={LEAVE_TYPE_OPTIONS}
                  value={selectedLeaveTypes}
                  onChange={(value) => {
                    setSelectedLeaveTypes(value);
                    setPage(1);
                  }}
                  clearable
                  searchable
                  w={180}
                  size="sm"
                  leftSection={<IconFilter size={16} />}
                  hidePickedOptions
                  styles={{
                    input: {
                      minHeight: 36,
                      maxHeight: 36,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollbarWidth: 'thin',
                    },
                    pill: {
                      flexShrink: 0,
                    },
                  }}
                />
              </Box>
            </Tooltip>

            {!isEmployeeOnly && (
              <Box
                style={{
                  width: showMyRequests ? 0 : 200,
                  overflow: 'hidden',
                  transition: 'width 0.2s',
                }}
              >
                {!showMyRequests && (
                  <Tooltip
                    label={
                      selectedEmployees.length > 0
                        ? selectedEmployees
                            .map((id) => employeeOptions.find((e) => e.value === id)?.label || id)
                            .join(', ')
                        : ''
                    }
                    disabled={selectedEmployees.length === 0}
                    multiline
                    w={300}
                  >
                    <Box>
                      <MultiSelect
                        placeholder={t('leaveRequest.filters.employee')}
                        data={employeeOptions}
                        value={selectedEmployees}
                        onChange={(value) => {
                          setSelectedEmployees(value);
                          setPage(1);
                        }}
                        clearable
                        searchable
                        w={200}
                        size="sm"
                        leftSection={<IconUser size={16} />}
                        styles={{
                          input: {
                            minHeight: 36,
                            maxHeight: 36,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            scrollbarWidth: 'thin',
                          },
                          pill: {
                            flexShrink: 0,
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            )}

            {isAdmin && (
              <Box
                style={{
                  width: showMyRequests ? 0 : 180,
                  overflow: 'hidden',
                  transition: 'width 0.2s',
                }}
              >
                {!showMyRequests && (
                  <Tooltip
                    label={
                      selectedDepartments.length > 0
                        ? selectedDepartments
                            .map(
                              (id) =>
                                (deptData?.data ?? []).find((d) => d.id === id)?.department_name ||
                                id,
                            )
                            .join(', ')
                        : ''
                    }
                    disabled={selectedDepartments.length === 0}
                    multiline
                    w={250}
                  >
                    <Box>
                      <MultiSelect
                        placeholder={t('leaveRequest.filters.department')}
                        data={(deptData?.data ?? []).map((d) => ({
                          value: d.id,
                          label: d.department_name,
                        }))}
                        value={selectedDepartments}
                        onChange={(value) => {
                          setSelectedDepartments(value);
                          setPage(1);
                        }}
                        clearable
                        searchable
                        w={180}
                        size="sm"
                        leftSection={<IconFilter size={16} />}
                        hidePickedOptions
                        styles={{
                          input: {
                            minHeight: 36,
                            maxHeight: 36,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            scrollbarWidth: 'thin',
                          },
                          pill: {
                            flexShrink: 0,
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            )}

            <Box style={{ flex: 1 }} />

            {!isEmployeeOnly && (
              <Button
                variant={showMyRequests ? 'filled' : 'light'}
                size="sm"
                leftSection={<IconUserCheck size={16} />}
                onClick={() => {
                  setShowMyRequests(!showMyRequests);
                  if (!showMyRequests) {
                    setSelectedEmployees([]);
                    setSelectedDepartments([]);
                  }
                  setPage(1);
                }}
                styles={{
                  root: {
                    minWidth: 130,
                  },
                }}
              >
                {t('leaveRequest.filters.myRequests')}
              </Button>
            )}

            {hasActiveFilters && (
              <Tooltip label={t('leaveRequest.filters.clearAll')} withArrow>
                <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleClearFilters}>
                  <IconFilterOff size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          {someSelected && (
            <Group
              gap="sm"
              p="xs"
              style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 6 }}
            >
              <Text size="sm" fw={500}>
                {t('leaveRequest.selectedCount', { count: selectedIndices.size })}
              </Text>
              <Button
                size="xs"
                color="green"
                leftSection={<IconChecks size={14} />}
                onClick={() => handleBulkAction(LEAVE_STATUS.APPROVED)}
              >
                {t('leaveRequest.approveAll')}
              </Button>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconX size={14} />}
                onClick={() => handleBulkAction(LEAVE_STATUS.REJECTED)}
              >
                {t('leaveRequest.rejectAll')}
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>

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

      <LeaveRequestFormModal
        opened={!!reviewRequest}
        onClose={handleCloseReview}
        mode="review"
        initialValues={reviewRequest}
        onSubmit={() => {}}
        onApprove={async (id, comment) => {
          const notiId = notify.loading(t('leaveRequest.approving'));
          try {
            await updateMutation.mutateAsync({
              id,
              status: LEAVE_STATUS.APPROVED,
              comment: comment.trim() || undefined,
            });
            notify.success(notiId, {
              message: t('leaveRequest.actionSuccess', {
                target: t('leaveRequest.singleRequest'),
                status: t('labels.leaveStatus.approved'),
              }),
            });
            setReviewRequest(null);
          } catch (e: any) {
            notify.error(notiId, {
              message: e?.response?.data?.message || t('leaveRequest.actionFailed'),
            });
          }
        }}
        onReject={async (id, comment) => {
          const notiId = notify.loading(t('leaveRequest.rejecting'));
          try {
            await updateMutation.mutateAsync({
              id,
              status: LEAVE_STATUS.REJECTED,
              comment: comment.trim() || undefined,
            });
            notify.success(notiId, {
              message: t('leaveRequest.actionSuccess', {
                target: t('leaveRequest.singleRequest'),
                status: t('labels.leaveStatus.rejected'),
              }),
            });
            setReviewRequest(null);
          } catch (e: any) {
            notify.error(notiId, {
              message: e?.response?.data?.message || t('leaveRequest.actionFailed'),
            });
          }
        }}
        loading={updateMutation.isPending}
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
                ? t('common.approve')
                : t('common.reject')}{' '}
              {(actionModal?.ids.length ?? 0) > 1
                ? t('leaveRequest.requestsCount', { count: actionModal?.ids.length ?? 0 })
                : t('leaveRequest.singleRequest')}
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
              ? t('leaveRequest.approveHint')
              : t('leaveRequest.rejectHint')}
          </Text>
          <Textarea
            label={t('common.commentOptional')}
            placeholder={
              actionModal?.status === LEAVE_STATUS.APPROVED
                ? t('leaveRequest.placeholders.approveComment')
                : t('leaveRequest.placeholders.rejectComment')
            }
            autosize
            minRows={3}
            value={actionComment}
            onChange={(e) => setActionComment(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt={4}>
            <Button variant="subtle" color="gray" onClick={() => setActionModal(null)}>
              {t('common.cancel')}
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
              {actionModal?.status === LEAVE_STATUS.APPROVED
                ? t('common.approve')
                : t('common.reject')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmComponent />
    </Stack>
  );
}
