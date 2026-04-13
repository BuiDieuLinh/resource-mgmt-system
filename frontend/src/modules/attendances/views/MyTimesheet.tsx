import { useMemo, useState } from 'react';
import { Stack, Group, Select, Loader, Center, SegmentedControl } from '@mantine/core';
import { IconCalendar, IconCalendarWeek } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { AttendanceSummaryCards } from '../components/AttendanceSummaryCards';
import { TimelineHeader } from '../components/AttendanceTimeline/TimelineHeader';
import { DayRow } from '../components/AttendanceTimeline/DayRow';
import { LeaveRequestModal } from '../components/LeaveRequestModal';
import MonthNavigator from '../components/MonthPickerInput';
import { getDaysInMonth, getWeeksInMonth } from '../utils/format';
import { useGetMyAttendance } from '../api/get-my-attendance';
import type { IAttendance, ILeaveRequest } from '../types';

export default function MyTimesheetPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(now);
  const [viewTab, setViewTab] = useState<string>('month');
  const [weekIdx, setWeekIdx] = useState(0);
  const [leaveModal, setLeaveModal] = useState<ILeaveRequest | null>(null);

  const month = selectedMonth ? selectedMonth.getMonth() + 1 : now.getMonth() + 1;
  const year = selectedMonth ? selectedMonth.getFullYear() : now.getFullYear();

  const { data, isLoading } = useGetMyAttendance(month, year);

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

  if (isLoading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  return (
    <Stack gap="md">
      <PageHeader title="My Timesheet" description="Your personal attendance records" />

      {data?.summary && <AttendanceSummaryCards summary={data.summary} />}

      <Group align="center" justify="space-between">
        <SegmentedControl
          size="sm"
          value={viewTab}
          onChange={handleViewChange}
          data={[
            {
              value: 'month',
              label: (
                <Group gap={4}>
                  <IconCalendar size={14} />
                  Month
                </Group>
              ),
            },
            {
              value: 'week',
              label: (
                <Group gap={4}>
                  <IconCalendarWeek size={14} />
                  Week
                </Group>
              ),
            },
          ]}
          w={180}
        />

        <Group>
          <MonthNavigator value={selectedMonth} onChange={handleMonthChange} />

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
      </Group>

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
          />
        ))}
      </Stack>

      <LeaveRequestModal
        opened={!!leaveModal}
        onClose={() => setLeaveModal(null)}
        leaveRequest={leaveModal}
        employeeName={data?.employee?.full_name ?? ''}
        mode="employee"
      />
    </Stack>
  );
}
