import { useState, useMemo } from 'react';
import {
  Stack,
  TextInput,
  Button,
  Group,
  Card,
  Badge,
  Select,
  Text,
  Menu,
  ActionIcon,
  Tooltip,
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
import { EmployeeColumn } from '@/components/EmployeeColumn/EmployeeColumn';
import { formatDays, formatMinutes } from '../utils/format';
import { exportSummaryExcel, exportEmployeeDetailExcel } from '../utils/exportExcel';
import { getEmployeeAttendance } from '../api/get-employee-attendance';
import { Loader, Center } from '@mantine/core';
import { buildAttendanceDetailUrl } from '@/routes/url';
import { useGetAllDepartments } from '@/modules/departments/api/get-departments';
import { useTranslation } from 'react-i18next';

export default function AttendancesPage() {
  const { t } = useTranslation();
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
    departmentOptions.find((d) => d.value === departmentFilter)?.label ?? t('common.all');

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
          detail.employee?.position?.position_name ?? t('common.notAvailable'),
          detail.employee?.position?.department?.department_name ?? t('common.notAvailable'),
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
      title: t('fields.employee'),
      fixed: 'left',
      render: (r) => (
        <EmployeeColumn
          employee={r.employee}
          pendingCount={(r as any).pending_leave_count ?? 0}
          onClick={() => navigate(buildAttendanceDetailUrl(r.employee_id, month, year))}
        />
      ),
    },
    {
      key: 'plan_day',
      title: t('attendance.overview.planned'),
      render: (r) => formatDays(r.plan_day),
      sortable: true,
    },
    {
      key: 'actual_day',
      title: t('attendance.overview.actual'),
      render: (r) => formatDays(r.actual_day),
      sortable: true,
    },
    {
      key: 'Late',
      title: t('attendance.overview.late'),
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
    {
      key: 'Absent',
      title: t('attendance.overview.absent'),
      render: (r) => formatDays(r.absent),
      sortable: true,
    },
    {
      key: 'annual_leave',
      title: t('attendance.overview.annualLeave'),
      render: (r) => formatDays(r.annual_leave),
      sortable: true,
    },
    {
      key: 'unpaid_leave',
      title: t('attendance.overview.unpaidLeave'),
      render: (r) => formatDays(r.unpaid_leave),
      sortable: true,
    },
    {
      key: 'holiday_days',
      title: t('attendance.overview.holiday'),
      render: (r) => formatDays((r as any).holiday_days),
      sortable: true,
    },
    {
      key: 'over_time',
      title: t('attendance.overview.overtime'),
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
      title: t('attendance.overview.diff'),
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
            {diff} {t('attendance.overview.daysShort')}
          </Text>
        );
      },
    },
    {
      key: 'export_detail',
      title: t('actions.actions'),
      align: 'center',
      fixed: 'right',
      render: (r) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label={t('attendance.overview.viewDetail')} withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="deepPurple"
              onClick={() => navigate(buildAttendanceDetailUrl(r.employee_id, month, year))}
            >
              <IconEye size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('actions.exportExcel')} withArrow>
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
        title={t('pages.attendanceTitle')}
        description={t('pages.attendanceDescription')}
        right={
          <Group gap="sm">
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <Button
                  variant="outline"
                  leftSection={<IconDownload size={16} />}
                  rightSection={<IconChevronDown size={14} />}
                >
                  {t('actions.export')}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconDownload size={14} />} onClick={handleExportSummary}>
                  {t('actions.exportSummaryExcel', {
                    department: selectedDeptName,
                    month,
                    year,
                  })}
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
                  placeholder={t('fields.searchEmployee')}
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
                  placeholder={t('fields.allDepartments')}
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

          {filtered.length === 0 && <Badge>{t('messages.noRecordsFound')}</Badge>}
        </>
      )}
    </Stack>
  );
}
