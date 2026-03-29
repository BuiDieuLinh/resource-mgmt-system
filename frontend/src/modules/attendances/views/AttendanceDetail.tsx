import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  Avatar,
  Tabs,
  Select,
  Loader,
  Center,
} from '@mantine/core';
import { IconCheck, IconCalendar, IconClock } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useGetEmployeeAttendance } from '../api/get-employee-attendance';
import { useApproveTimesheet } from '../api/approve-timesheet';
import { LeaveRequestModal } from '../components/LeaveRequestModal';
import { AttendanceSummaryCards } from '../components/AttendanceSummaryCards';
import { TimelineHeader } from '../components/AttendanceTimeline/TimelineHeader';
import { DayRow } from '../components/AttendanceTimeline/DayRow';
import { buildMockAttendanceDetail } from '../mock/attendance-detail.mock';
import { getDaysInMonth, getWeeksInMonth } from '../utils/format';
import { useUrlParams } from '@/hooks/useUrlParams';
import type { IAttendance, ILeaveRequest } from '../types';

export default function AttendanceDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  const { getInt, get, set } = useUrlParams({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    view: 'month',
    week: '0',
  });

  const month = getInt('month');
  const year = getInt('year');
  const viewTab = get('view');
  const weekIdx = getInt('week');

  const [leaveModal, setLeaveModal] = useState<ILeaveRequest | null>(null);

  const { isLoading } = useGetEmployeeAttendance(employeeId!, month, year);
  const { mutate: approve, isPending: approving } = useApproveTimesheet();

  // TODO: replace with real API data when backend is ready
  const data = useMemo(() => buildMockAttendanceDetail(year, month), [year, month]);

  const allDays = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);

  const recordMap = useMemo(() => {
    const map = new Map<string, IAttendance>();
    data.records.forEach((r) => {
      const key = new Date(r.work_date ?? r.date ?? '').toDateString();
      map.set(key, r);
    });
    return map;
  }, [data.records]);

  const displayDays = viewTab === 'week' ? (weeks[weekIdx] ?? []) : allDays;

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: `${year}-${i + 1}`,
        label: new Date(year, i, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      })),
    [year],
  );

  const weekOptions = useMemo(
    () =>
      weeks.map((w, i) => ({
        value: String(i),
        label: `Week ${i + 1}: ${w[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} – ${w[w.length - 1].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`,
      })),
    [weeks],
  );

  const { employee, summary, leave_requests } = data;

  if (isLoading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Avatar size="md" radius="xl" color="blue">
            {employee.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </Avatar>
          <Stack gap={0}>
            <Title order={3}>{employee.full_name}</Title>
            <Text size="xs" c="dimmed">
              {employee.department.department_name} · {employee.position.position_name}
            </Text>
          </Stack>
        </Group>

        <Button
          leftSection={<IconCheck size={16} />}
          color="green"
          loading={approving}
          onClick={() => employeeId && approve({ employeeId, month, year })}
        >
          Approve Timesheet
        </Button>
      </Group>

      {/* Summary */}
      <AttendanceSummaryCards summary={summary} />

      {/* View controls */}
      <Group justify="space-between" align="center">
        <Tabs value={viewTab} onChange={(v) => set({ view: v, week: '0' })}>
          <Tabs.List>
            <Tabs.Tab value="month" leftSection={<IconCalendar size={14} />}>
              Month
            </Tabs.Tab>
            <Tabs.Tab value="week" leftSection={<IconClock size={14} />}>
              Week
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Group gap="sm">
          <Select
            checkIconPosition="right"
            size="sm"
            value={`${year}-${month}`}
            data={monthOptions}
            onChange={(v) => {
              if (!v) return;
              const [y, m] = v.split('-').map(Number);
              set({ year: y, month: m, week: '0' });
            }}
            w={200}
          />
          {viewTab === 'week' && (
            <Select
              size="sm"
              checkIconPosition="right"
              value={String(weekIdx)}
              data={weekOptions}
              onChange={(v) => set({ week: v })}
              w={220}
            />
          )}
        </Group>
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
            leaveRequests={leave_requests}
            onLeaveClick={setLeaveModal}
          />
        ))}
      </Stack>

      <LeaveRequestModal
        opened={!!leaveModal}
        onClose={() => setLeaveModal(null)}
        leaveRequest={leaveModal}
        employeeName={employee.full_name}
      />
    </Stack>
  );
}
