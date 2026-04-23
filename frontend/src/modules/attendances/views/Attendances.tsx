import { useState, useMemo } from 'react';
import { Stack, TextInput, Button, Group, Card, Badge, Select, Anchor, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import type { IAttendance } from '../types';

import { useGetAttendanceSummaries } from '../api/get-attendance-summaries';
import { useCreateAttendance } from '../api/create-attendance';
import { useUpdateAttendance } from '../api/update-attendance';
import { AttendanceFormModal } from '../components/AttendanceFormModal';
import MonthNavigator from '../components/MonthPickerInput';
import { formatDays, formatHours, exportAttendanceCsv } from '../utils/format';
import { Loader, Center } from '@mantine/core';
import { buildAttendanceDetailUrl } from '@/routes/url';
import { ATTENDANCE_STATUS } from '@/constant';

export default function AttendancesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() => new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IAttendance | null>(null);

  const { data: attendances = [], isLoading } = useGetAttendanceSummaries({
    month: selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1,
    year: selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear(),
  });

  const { mutateAsync: add } = useCreateAttendance();
  const { mutateAsync: update } = useUpdateAttendance();

  const filtered = useMemo(() => {
    return attendances
      .filter((r) => {
        if (search) {
          const term = search.toLowerCase();
          return (
            r.employee?.full_name.toLowerCase().includes(term) ||
            r.employee_id.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .filter((r) => {
        if (dateFilter) {
          return new Date(r.date).toDateString() === new Date(dateFilter).toDateString();
        }
        return true;
      })
      .filter((r) => {
        if (statusFilter) {
          return r.status === statusFilter;
        }
        return true;
      });
  }, [attendances, search, dateFilter, statusFilter]);

  const columns: TableColumn<IAttendance>[] = [
    {
      key: 'employee_id',
      title: 'Employee',
      render: (r) => {
        const name = r.employee?.full_name ?? r.employee_id;
        const month = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1;
        const year = selectedMonth ? selectedMonth.getFullYear() : new Date().getFullYear();

        return (
          <Group gap="xs">
            <Anchor
              size="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(buildAttendanceDetailUrl(r.employee_id, month, year))}
            >
              {name}
            </Anchor>
          </Group>
        );
      },
    },
    {
      key: 'plan_day',
      title: 'Planned',
      render: (r) => formatDays(r.plan_day),
      sortable: true,
    },
    {
      key: 'actual_day',
      title: 'Actual',
      render: (r) => formatDays(r.actual_day),
      sortable: true,
    },
    {
      key: 'Late',
      title: 'Late',
      render: (r) => formatDays(r.late),
      sortable: true,
    },
    {
      key: 'Absent',
      title: 'Absent',
      render: (r) => formatDays(r.absent),
      sortable: true,
    },
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
      key: 'over_time',
      title: 'Over Time',
      render: (r) => {
        const val = r.over_time || 0;
        return (
          <Text size="sm" c={val > 0 ? 'blue' : undefined}>
            {formatHours(val)}
          </Text>
        );
      },
      sortable: true,
    },
    {
      key: 'difference',
      title: 'Difference',
      render: (r) => {
        const plan = r.plan_day || 0;
        const actual = r.actual_day || 0;
        const diff = actual - plan;
        const sign = diff > 0 ? '+' : '';
        const color = diff > 0 ? 'green' : diff < 0 ? 'red' : undefined;
        const formattedStr =
          diff === 0
            ? '-'
            : Number.isInteger(diff)
              ? `${sign}${diff} d`
              : `${sign}${diff.toString().replace('.', 'd ')}`;
        return (
          <Text size="sm" c={color}>
            {formattedStr}
          </Text>
        );
      },
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      render: (r) => {
        return (
          <Badge
            variant="light"
            fw={400}
            color={
              r.status === ATTENDANCE_STATUS.APPROVED
                ? 'green'
                : r.status === ATTENDANCE_STATUS.PENDING
                  ? 'yellow'
                  : 'gray'
            }
          >
            {r.status}
          </Badge>
        );
      },
      sortable: true,
    },
  ];

  return (
    <Stack gap="md">
      <PageHeader
        title="Attendance"
        description="Track and manage employee attendance records"
        right={
          <Group gap="sm">
            <Button variant="outline" onClick={() => exportAttendanceCsv(filtered)}>
              Export CSV
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              New record
            </Button>
          </Group>
        }
      />

      {isLoading ? (
        <Center style={{ height: 200 }}>
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm">
            <Group gap="md" align="center" justify="space-between">
              <Group gap="md" align="flex-end">
                <TextInput
                  placeholder="Search employee..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                />
                <DateInput
                  placeholder="Filter by date"
                  value={dateFilter}
                  onChange={setDateFilter}
                  clearable
                />
                <Select
                  checkIconPosition="right"
                  placeholder="Status"
                  data={[
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Pending', label: 'Pending' },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  clearable
                />
              </Group>
              <Group justify="space-between" align="center">
                <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />
              </Group>
            </Group>
          </Card>

          <BaseTable
            columns={columns}
            data={filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
            loading={false}
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

      <AttendanceFormModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing || undefined}
        onSave={async (payload) => {
          if (editing) {
            await update({ id: editing.id, payload });
          } else {
            await add(payload as any);
          }
          setModalOpen(false);
        }}
      />
    </Stack>
  );
}
