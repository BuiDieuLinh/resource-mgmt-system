import { useState, useMemo } from 'react';
import { Stack, Group, Title, Text, Button, Avatar, Select, SegmentedControl } from '@mantine/core';
import { IconCheck, IconCalendar, IconCalendarWeek } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useGetEmployeeAttendance } from '../api/get-employee-attendance';
import { useApproveTimesheet } from '../api/approve-timesheet';
import { LeaveRequestModal } from '../components/LeaveRequestModal';
import { AttendanceSummaryCards } from '../components/AttendanceSummaryCards';
import { TimelineHeader } from '../components/AttendanceTimeline/TimelineHeader';
import { DayRow } from '../components/AttendanceTimeline/DayRow';
import MonthNavigator from '../components/MonthPickerInput';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { getDaysInMonth, getWeeksInMonth } from '../utils/format';
import { attendanceUrl } from '@/routes/url';
import { TimesheetSkeleton } from '@/components/Skeleton/TimesheetSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { IAttendance, ILeaveRequest } from '../types';

export default function AttendanceDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(now);
  const [viewTab, setViewTab] = useState('month');
  const [weekIdx, setWeekIdx] = useState(0);
  const [leaveModal, setLeaveModal] = useState<ILeaveRequest | null>(null);

  const month = selectedMonth ? selectedMonth.getMonth() + 1 : now.getMonth() + 1;
  const year = selectedMonth ? selectedMonth.getFullYear() : now.getFullYear();

  const { data, isLoading: _loading } = useGetEmployeeAttendance(employeeId!, month, year);
  const isLoading = useDelayedLoading(_loading);
  const { mutate: approve, isPending: approving } = useApproveTimesheet();

  const allDays = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);

  const recordMap = useMemo(() => {
    const map = new Map<string, IAttendance>();
    (data?.records ?? []).forEach((r) => {
      const key = new Date(r.work_date ?? r.date ?? '').toDateString();
      map.set(key, r);
    });
    return map;
  }, [data]);

  const workStartMin = useMemo(() => {
    const schedules = data?.work_schedules ?? [];
    if (!schedules.length) return undefined;
    return Math.min(...schedules.map((s) => s.start_time));
  }, [data]);

  const workEndMin = useMemo(() => {
    const schedules = data?.work_schedules ?? [];
    if (!schedules.length) return undefined;
    return Math.max(...schedules.map((s) => s.end_time));
  }, [data]);

  const displayDays = viewTab === 'week' ? (weeks[weekIdx] ?? []) : allDays;

  const weekOptions = useMemo(
    () =>
      weeks.map((w, i) => ({
        value: String(i),
        label: `Week ${i + 1}: ${w[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} – ${w[w.length - 1].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`,
      })),
    [weeks],
  );

  const handleMonthChange = (d: Date | null) => {
    setSelectedMonth(d);
    setWeekIdx(0);
  };

  const handleViewChange = (v: string) => {
    setViewTab(v);
    setWeekIdx(0);
  };

  const employee = data?.employee;

  if (isLoading) return <TimesheetSkeleton />;

  return (
    <Stack gap="md">
      <PageHeader
        breadcrumbs={[
          { label: 'Attendance', path: attendanceUrl },
          { label: employee?.full_name ?? '...' },
        ]}
      />

      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Avatar size="md" radius="xl" color="blue">
            {(employee?.full_name ?? '?')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Avatar>
          <Stack gap={0}>
            <Title order={3}>{employee?.full_name ?? '—'}</Title>
            <Text size="xs" c="dimmed">
              {employee?.department?.department_name} · {employee?.position?.position_name}
            </Text>
          </Stack>
        </Group>

        <Group gap="sm">
          <MonthNavigator value={selectedMonth} onChange={handleMonthChange} />
          <Button
            leftSection={<IconCheck size={16} />}
            color="green"
            loading={approving}
            onClick={() => employeeId && approve({ employeeId, month, year })}
          >
            Approve Timesheet
          </Button>
        </Group>
      </Group>

      {/* Summary */}
      {data?.summary && <AttendanceSummaryCards summary={data.summary} />}

      {/* View controls */}
      <Group align="center">
        <SegmentedControl
          size="sm"
          value={viewTab}
          onChange={handleViewChange}
          data={[
            {
              value: 'month',
              label: (
                <Group gap={6} w={70}>
                  <IconCalendar size={14} />
                  Month
                </Group>
              ),
            },
            {
              value: 'week',
              label: (
                <Group gap={6} w={70}>
                  <IconCalendarWeek size={14} />
                  Week
                </Group>
              ),
            },
          ]}
        />
        {viewTab === 'week' && (
          <Select
            size="sm"
            checkIconPosition="right"
            value={String(weekIdx)}
            data={weekOptions}
            onChange={(v) => setWeekIdx(Number(v ?? 0))}
            w={240}
          />
        )}
      </Group>

      {/* Timeline */}
      <Stack gap="xs">
        <div style={{ padding: '0 12px' }}>
          <TimelineHeader />
        </div>
        {displayDays.map((day) => (
          <DayRow
            key={day.toISOString()}
            day={day}
            record={recordMap.get(day.toDateString())}
            leaveRequests={data?.leave_requests ?? []}
            onLeaveClick={setLeaveModal}
            holidays={data?.holidays ?? []}
            workSchedules={data?.work_schedules ?? []}
            workStartMin={workStartMin}
            workEndMin={workEndMin}
          />
        ))}
      </Stack>

      <LeaveRequestModal
        opened={!!leaveModal}
        onClose={() => setLeaveModal(null)}
        leaveRequest={leaveModal}
        employeeName={employee?.full_name ?? ''}
      />
    </Stack>
  );
}
