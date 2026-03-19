import { Card, Text, Group, Badge, Tooltip } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { IAttendance, ILeaveRequest } from '../../types';
import { fmtTime, leaveOverlapsDay } from '../../utils/format';
import { TimelineBar } from './TimelineBar';
import { COL_DATE, COL_TIME, COL_BADGE } from './timeline.constants';

interface Props {
  day: Date;
  record?: IAttendance;
  leaveRequests: ILeaveRequest[];
  onLeaveClick: (lr: ILeaveRequest) => void;
}

const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: 'teal',
  rejected: 'red',
  pending: 'yellow',
};

export function DayRow({ day, record, leaveRequests, onLeaveClick }: Props) {
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  const dayLabel = day.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
  const dayLeaves = leaveRequests.filter((lr) => leaveOverlapsDay(lr, day));

  const lateMin = record?.late ?? 0;
  const earlyLeaveMin = record?.early_leave ?? 0;
  const overtimeMin = record?.overtime ?? 0;

  return (
    <Card
      withBorder
      p="xs"
      radius="sm"
      bg={isWeekend ? 'gray.0' : dayLeaves.length > 0 ? 'blue.0' : undefined}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${COL_DATE}px ${COL_TIME}px 1fr ${COL_BADGE}px`,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Text size="xs" fw={500} c={isWeekend ? 'dimmed' : undefined} truncate>
          {dayLabel}
        </Text>

        <Text size="xs" c="dimmed" ff="monospace">
          {fmtTime(record?.check_in_time ?? record?.check_in)} –{' '}
          {fmtTime(record?.check_out_time ?? record?.check_out)}
        </Text>

        <TimelineBar record={record} />

        <Group gap={4} wrap="nowrap" justify="flex-end">
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
          {!record && !isWeekend && dayLeaves.length === 0 && (
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
