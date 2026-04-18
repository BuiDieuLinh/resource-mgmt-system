import { Card, Text, Group, Badge, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconSunHigh } from '@tabler/icons-react';
import type { IAttendance, ILeaveRequest, IHoliday, IWorkSchedule } from '../../types';
import { fmtTime, leaveOverlapsDay } from '../../utils/format';
import { TimelineBar } from './TimelineBar';
import { COL_DATE, COL_TIME, COL_BADGE } from './timeline.constants';

interface Props {
  day: Date;
  record?: IAttendance;
  leaveRequests: ILeaveRequest[];
  onLeaveClick: (lr: ILeaveRequest) => void;
  holidays?: IHoliday[];
  workSchedules?: IWorkSchedule[];
  workStartMin?: number;
  workEndMin?: number;
}

const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: 'teal',
  rejected: 'red',
  pending: 'yellow',
};

const DOW_MAP = [6, 0, 1, 2, 3, 4, 5];

export function DayRow({
  day,
  record,
  leaveRequests,
  onLeaveClick,
  holidays = [],
  workSchedules = [],
  workStartMin,
  workEndMin,
}: Props) {
  const jsDay = day.getDay();
  const dow = DOW_MAP[jsDay];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const isPast = dayStart < today;

  // For past days without a record: use natural weekend (Sat/Sun) as off-day
  // because we don't have schedule history — current schedule may differ from what was active then.
  // For today/future: use current workSchedules to show expected working days.
  // If there's a record, the employee actually worked → always treat as work day.
  const isWorkDay = record
    ? true
    : isPast
      ? jsDay !== 0 && jsDay !== 6 // past + no record → natural Mon-Fri only
      : workSchedules.length === 0
        ? jsDay !== 0 && jsDay !== 6
        : workSchedules.some((s) => s.day_of_week === dow);

  const isWeekend = !isWorkDay;

  // Check holiday
  const dayIso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const holiday = holidays.find((h) => h.holiday_date.slice(0, 10) === dayIso);

  const dayLabel = day.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
  const dayLeaves = leaveRequests.filter((lr) => leaveOverlapsDay(lr, day));

  const lateMin = record?.late ?? 0;
  const earlyLeaveMin = record?.early_leave ?? 0;
  const overtimeMin = record?.overtime ?? 0;

  let bgColor: string | undefined;
  if (holiday) bgColor = 'var(--mantine-color-orange-0)';
  else if (dayLeaves.length > 0) bgColor = 'var(--mantine-color-blue-0)';
  else if (isWeekend) bgColor = 'var(--mantine-color-gray-0)';

  return (
    <Card withBorder p="xs" radius="sm" bg={bgColor}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${COL_DATE}px ${COL_TIME}px 1fr ${COL_BADGE}px`,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Group gap={4} wrap="nowrap">
          <Text size="xs" fw={500} c={isWeekend || holiday ? 'dimmed' : undefined} truncate>
            {dayLabel}
          </Text>
          {holiday && (
            <Tooltip label={holiday.name} withArrow>
              <IconSunHigh size={12} color="var(--mantine-color-orange-5)" />
            </Tooltip>
          )}
        </Group>

        <Text size="xs" c="dimmed" ff="monospace">
          {!isWeekend || record ? (
            <>
              {fmtTime(record?.check_in_time ?? record?.check_in)} –{' '}
              {fmtTime(record?.check_out_time ?? record?.check_out)}
            </>
          ) : null}
        </Text>

        {!isWeekend || record ? (
          <TimelineBar record={record} workStartMin={workStartMin} workEndMin={workEndMin} />
        ) : (
          <TimelineBar record={record} hideWorkWindow />
        )}

        <Group gap={4} wrap="nowrap" justify="flex-end">
          {holiday && (
            <Badge size="xs" color="orange" variant="light">
              {holiday.is_paid ? 'Holiday' : 'Unpaid'}
            </Badge>
          )}
          {lateMin > 0 && (
            <Badge size="xs" color="red" variant="light">
              +{lateMin}m
            </Badge>
          )}
          {earlyLeaveMin > 0 && (
            <Badge size="xs" color="yellow" variant="light">
              -{earlyLeaveMin}m
            </Badge>
          )}
          {overtimeMin > 0 && (
            <Badge size="xs" color="blue" variant="light">
              OT+{overtimeMin}m
            </Badge>
          )}
          {!record && !isWeekend && !holiday && dayLeaves.length === 0 && (
            <Badge size="xs" color="gray" variant="light">
              –
            </Badge>
          )}
          {dayLeaves.map((lr) => (
            <Tooltip key={lr.id} label="View leave request" withArrow>
              <Badge
                size="xs"
                color={LEAVE_STATUS_COLOR[lr.status] ?? 'gray'}
                variant="filled"
                style={{ cursor: 'pointer' }}
                leftSection={<IconAlertCircle size={9} />}
                onClick={() => onLeaveClick(lr)}
              >
                {lr.leave_type}
              </Badge>
            </Tooltip>
          ))}
        </Group>
      </div>
    </Card>
  );
}
