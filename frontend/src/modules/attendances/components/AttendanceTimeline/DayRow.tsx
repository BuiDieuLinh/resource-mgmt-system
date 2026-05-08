import {
  Card,
  Text,
  Group,
  Badge,
  Tooltip,
  Anchor,
  Popover,
  useMantineColorScheme,
} from '@mantine/core';
import { IconAlertCircle, IconStarFilled, IconMapPin } from '@tabler/icons-react';
import type {
  IAttendance,
  IAttendanceLogs,
  ILeaveRequest,
  IHoliday,
  IWorkSchedule,
} from '../../types';
import { fmtTime, leaveOverlapsDay } from '../../utils/format';
import { TimelineBar } from './TimelineBar';
import { COL_DATE, COL_TIME, COL_BADGE } from './timeline.constants';
import { useState } from 'react';
import { reverseGeocode } from '../../api/reverse-geocode';

interface Props {
  day: Date;
  record?: IAttendance;
  leaveRequests: ILeaveRequest[];
  onLeaveClick: (lr: ILeaveRequest) => void;
  holidays?: IHoliday[];
  workSchedules?: IWorkSchedule[];
  workStartMin?: number;
  workEndMin?: number;
  activePopoverId?: string | null;
  onPopoverChange?: (id: string | null) => void;
}

const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: 'teal',
  rejected: 'red',
  pending: 'yellow',
};

const DOW_MAP = [6, 0, 1, 2, 3, 4, 5];

function LocationPopover({
  id,
  log,
  label,
  time,
  activeId,
  onOpen,
  onClose,
}: {
  id: string;
  log?: IAttendanceLogs;
  label: string;
  time?: string;
  activeId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLocation = log && log.latitude != null && log.longitude != null;
  const opened = activeId === id;

  if (!time) return <span>–</span>;
  if (!hasLocation) return <span>{time}</span>;

  const handleOpen = async () => {
    onOpen(id);
    if (address || loading) return;
    setLoading(true);
    const result = await reverseGeocode(Number(log.latitude), Number(log.longitude));
    setAddress(result);
    setLoading(false);
  };

  return (
    <Popover opened={opened} onClose={onClose} position="top" withArrow shadow="md" width={260}>
      <Popover.Target>
        <Text
          component="span"
          size="xs"
          ff="monospace"
          style={{ cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
          onClick={handleOpen}
        >
          {time}
        </Text>
      </Popover.Target>

      <Popover.Dropdown p="sm">
        <Group gap={6} mb={6}>
          <IconMapPin size={13} color="var(--mantine-color-blue-6)" />
          <Text size="xs" fw={600}>
            {label} location
          </Text>
        </Group>
        <Text size="xs" c="dimmed" lh={1.5}>
          {loading ? 'Loading address...' : (address ?? '...')}
        </Text>
        <Anchor
          size="xs"
          href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          mt={6}
          display="block"
        >
          Open in Google Maps ↗
        </Anchor>
      </Popover.Dropdown>
    </Popover>
  );
}

export function DayRow({
  day,
  record,
  leaveRequests,
  onLeaveClick,
  holidays = [],
  workSchedules = [],
  workStartMin,
  workEndMin,
  activePopoverId = null,
  onPopoverChange,
}: Props) {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const jsDay = day.getDay();
  const dow = DOW_MAP[jsDay];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const isPast = dayStart < today;

  const isWorkDay = record
    ? true
    : isPast
      ? jsDay !== 0 && jsDay !== 6
      : workSchedules.length === 0
        ? jsDay !== 0 && jsDay !== 6
        : workSchedules.some((s) => s.day_of_week === dow);

  const isWeekend = !isWorkDay;

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
  if (holiday) bgColor = dark ? 'rgba(255, 146, 43, 0.08)' : 'var(--mantine-color-orange-0)';
  else if (dayLeaves.length > 0)
    bgColor = dark ? 'rgba(51, 154, 240, 0.08)' : 'var(--mantine-color-blue-0)';
  else if (isWeekend) bgColor = dark ? 'rgba(255,255,255,0.03)' : 'var(--mantine-color-gray-0)';

  const checkInLog = record?.logs?.find((l) => l.action === 'check_in');
  const checkOutLog = record?.logs?.find((l) => l.action === 'check_out');
  const checkInTime = fmtTime(record?.check_in_time ?? record?.check_in);
  const checkOutTime = fmtTime(record?.check_out_time ?? record?.check_out);

  // Unique IDs per record per action
  const checkInId = record ? `${record.id}-checkin` : '';
  const checkOutId = record ? `${record.id}-checkout` : '';

  return (
    <Card withBorder p="xs" radius="sm" bg={bgColor} data-testid="day-row-timesheet">
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
              <IconStarFilled size={14} color="var(--mantine-color-orange-5)" />
            </Tooltip>
          )}
        </Group>

        <Group gap={4} wrap="nowrap" align="center">
          {!isWeekend || record ? (
            <Text size="xs" c="dimmed" ff="monospace" component="span">
              <LocationPopover
                id={checkInId}
                log={checkInLog}
                label="Check-in"
                time={checkInTime}
                activeId={activePopoverId}
                onOpen={(id) => onPopoverChange?.(id)}
                onClose={() => onPopoverChange?.(null)}
              />
              {' – '}
              <LocationPopover
                id={checkOutId}
                log={checkOutLog}
                label="Check-out"
                time={checkOutTime}
                activeId={activePopoverId}
                onOpen={(id) => onPopoverChange?.(id)}
                onClose={() => onPopoverChange?.(null)}
              />
            </Text>
          ) : null}
        </Group>

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
                leftSection={<IconAlertCircle size={11} />}
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
