import { useState, useMemo } from 'react';
import {
  Stack,
  TextInput,
  Button,
  Group,
  Card,
  Badge,
  Select,
  Anchor,
  Text,
  Menu,
  ActionIcon,
  Tooltip,
  Avatar,
} from '@mantine/core';
import {
  IconSearch,
  IconDownload,
  IconChevronDown,
  IconFileExport,
  IconEye,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import type { IAttendance } from '../types';
import { useGetAttendanceSummaries } from '../api/get-attendance-summaries';
import MonthNavigator from '../components/MonthPickerInput';
import { formatDays, formatMinutes } from '../utils/format';
import { exportSummaryExcel, exportEmployeeDetailExcel } from '../utils/exportExcel';
import { getEmployeeAttendance } from '../api/get-employee-attendance';
import { Loader, Center } from '@mantine/core';
import { buildAttendanceDetailUrl } from '@/routes/url';
import { useGetAllDepartments } from '@/modules/departments/api/get-departments';

export default function AttendancesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() => new Date());
  const [exportingEmployeeId, setExportingEmployeeId] = useState<string | null>(null);

  const month = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1;
  const year = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();

  const { data: attendances = [], isLoading } = useGetAttendanceSummaries({
    month,
    year,
    department_id: departmentFilter ?? undefined,
  });

  const { data: deptData } = useGetAllDepartments();
  const departmentOptions = useMemo(
    () => (deptData?.data ?? []).map((d: any) => ({ value: d.id, label: d.department_name })),
    [deptData],
  );

  const filtered = useMemo(
    () =>
      attendances.filter((r) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
          r.employee?.full_name?.toLowerCase().includes(term) ||
          r.employee_id?.toLowerCase().includes(term)
        );
      }),
    [attendances, search],
  );

  const selectedDeptName =
    departmentOptions.find((d) => d.value === departmentFilter)?.label ?? 'All';

  const handleExportSummary = () => {
    exportSummaryExcel(filtered, month, year, selectedDeptName);
  };

  const handleExportDetail = async (row: any) => {
    setExportingEmployeeId(row.employee_id);
    try {
      const detail = await getEmployeeAttendance(row.employee_id, month, year);
      if (detail) {
        await exportEmployeeDetailExcel(
          row.employee?.full_name ?? row.employee_id,
          detail.employee?.position?.position_name ?? '—',
          detail.employee?.position?.department?.department_name ?? '—',
          detail.records ?? [],
          detail.leave_requests ?? [],
          detail.work_policy ?? null,
          detail.holidays ?? [],
          month,
          year,
        );
      }
    } finally {
      setExportingEmployeeId(null);
    }
  };

  const columns: TableColumn<IAttendance>[] = [
    {
      key: 'employee_id',
      title: 'Employee',
      fixed: 'left',
      render: (r) => {
        const pending = (r as any).pending_leave_count ?? 0;
        const emp = r.employee as any;
        const fullName = emp?.full_name ?? r.employee_id;
        const code = emp?.employee_code ?? '';
        const avatarUrl = emp?.avatar_url;
        const words = fullName.trim().split(/\s+/);
        const initials =
          words.length >= 2
            ? `${words[words.length - 1][0]}${words[0][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        return (
          <Group gap={8} wrap="nowrap">
            <Avatar src={avatarUrl} size={32} radius="xl" color="deepPurple" variant="light">
              {!avatarUrl && (
                <Text size="10px" fw={700}>
                  {initials}
                </Text>
              )}
            </Avatar>
            <Stack gap={0}>
              <Group gap={6} wrap="nowrap">
                <Anchor
                  size="sm"
                  fw={500}
                  style={{ cursor: 'pointer', lineHeight: 1.3 }}
                  onClick={() => navigate(buildAttendanceDetailUrl(r.employee_id, month, year))}
                >
                  {fullName}
                </Anchor>
                {pending > 0 && (
                  <Tooltip
                    label={`${pending} leave request${pending > 1 ? 's' : ''} pending admin review`}
                    withArrow
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: 'var(--mantine-color-orange-1)',
                        border: '1px solid var(--mantine-color-orange-3)',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--mantine-color-orange-7)',
                        lineHeight: 1.4,
                        cursor: 'default',
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'var(--mantine-color-orange-5)',
                          display: 'inline-block',
                        }}
                      />
                      {pending} pending
                    </span>
                  </Tooltip>
                )}
              </Group>
              {code && (
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
                  {code}
                </Text>
              )}
            </Stack>
          </Group>
        );
      },
    },
    { key: 'plan_day', title: 'Planned', render: (r) => formatDays(r.plan_day), sortable: true },
    { key: 'actual_day', title: 'Actual', render: (r) => formatDays(r.actual_day), sortable: true },
    {
      key: 'Late',
      title: 'Late',
      sortable: true,
      render: (r) => {
        const mins = (r as any).late_minutes ?? 0;
        if (!mins)
          return (
            <Text size="sm" c="dimmed">
              —
            </Text>
          );
        return (
          <Text size="sm" c="orange">
            {formatMinutes(mins)}
          </Text>
        );
      },
    },
    { key: 'Absent', title: 'Absent', render: (r) => formatDays(r.absent), sortable: true },
    {
      key: 'annual_leave',
      title: 'Annual Leave',
      render: (r) => formatDays(r.annual_leave),
      sortable: true,
    },
    {
      key: 'unpaid_leave',
      title: 'Unpaid Leave',
      render: (r) => formatDays(r.unpaid_leave),
      sortable: true,
    },
    {
      key: 'holiday_days',
      title: 'Holiday',
      render: (r) => formatDays((r as any).holiday_days),
      sortable: true,
    },
    {
      key: 'over_time',
      title: 'Overtime',
      sortable: true,
      render: (r) => {
        const mins = r.over_time || 0;
        return (
          <Text size="sm" c={mins > 0 ? 'blue' : 'dimmed'}>
            {formatMinutes(mins)}
          </Text>
        );
      },
    },
    {
      key: 'difference',
      title: 'Diff',
      sortable: true,
      render: (r) => {
        const diff = (r.actual_day || 0) - (r.plan_day || 0);
        if (diff === 0)
          return (
            <Text size="sm" c="dimmed">
              —
            </Text>
          );
        const sign = diff > 0 ? '+' : '';
        return (
          <Text size="sm" c={diff > 0 ? 'green' : 'red'}>
            {sign}
            {diff} d
          </Text>
        );
      },
    },
    {
      key: 'export_detail',
      title: 'Actions',
      align: 'center',
      fixed: 'right',
      render: (r) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label="View detail" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="deepPurple"
              onClick={() => navigate(buildAttendanceDetailUrl(r.employee_id, month, year))}
            >
              <IconEye size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export Excel" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              loading={exportingEmployeeId === r.employee_id}
              onClick={(e) => {
                e.stopPropagation();
                handleExportDetail(r);
              }}
            >
              <IconFileExport size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="md">
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance records"
        right={
          <Group gap="sm">
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <Button
                  variant="outline"
                  leftSection={<IconDownload size={16} />}
                  rightSection={<IconChevronDown size={14} />}
                >
                  Export
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconDownload size={14} />} onClick={handleExportSummary}>
                  Export Summary Excel ({selectedDeptName}, {month}/{year})
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        }
      />

      {isLoading ? (
        <Center style={{ height: 200 }}>
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm">
            <Group gap="md" align="flex-end" justify="space-between">
              <Group gap="sm" align="flex-end">
                <TextInput
                  placeholder="Search employee..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                  w={200}
                />
                <Select
                  checkIconPosition="right"
                  placeholder="All departments"
                  data={departmentOptions}
                  value={departmentFilter}
                  onChange={(v) => {
                    setDepartmentFilter(v);
                    setPage(1);
                  }}
                  clearable
                  w={180}
                />
              </Group>
              <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />
            </Group>
          </Card>

          <BaseTable
            columns={columns}
            data={filtered.slice((page - 1) * pageSize, page * pageSize)}
            loading={false}
            height={450}
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

          {filtered.length === 0 && <Badge>No records found</Badge>}
        </>
      )}
    </Stack>
  );
}
