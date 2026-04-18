import { Tooltip, useMantineColorScheme } from '@mantine/core';
import type { IAttendance } from '../../types';
import {
  toPct,
  toMinutesUTC,
  TICK_LABELS,
  WORK_START_MIN,
  WORK_END_MIN,
} from './timeline.constants';

interface Segment {
  left: number;
  width: number;
  color: string;
  label: string;
}

function buildSegments(
  checkIn: number,
  checkOut: number,
  workStart = WORK_START_MIN,
  workEnd = WORK_END_MIN,
): Segment[] {
  const segments: Segment[] = [];
  const isLate = checkIn > workStart;
  const isEarlyLeave = checkOut < workEnd;
  const hasOvertime = checkOut > workEnd;

  if (isLate) {
    segments.push({
      left: toPct(workStart),
      width: toPct(checkIn) - toPct(workStart),
      color: 'var(--mantine-color-red-6)',
      label: 'Late',
    });
  }

  const workEnd_ = Math.min(checkOut, workEnd);
  if (workEnd_ > checkIn) {
    segments.push({
      left: toPct(checkIn),
      width: toPct(workEnd_) - toPct(checkIn),
      color: isLate ? 'var(--mantine-color-orange-5)' : 'var(--mantine-color-teal-6)',
      label: 'Work',
    });
  }

  if (isEarlyLeave) {
    segments.push({
      left: toPct(checkOut),
      width: toPct(workEnd) - toPct(checkOut),
      color: 'var(--mantine-color-yellow-5)',
      label: 'Early leave',
    });
  }

  if (hasOvertime) {
    segments.push({
      left: toPct(workEnd),
      width: toPct(checkOut) - toPct(workEnd),
      color: 'var(--mantine-color-blue-5)',
      label: 'Overtime',
    });
  }

  return segments;
}

interface Props {
  record?: IAttendance;
  workStartMin?: number;
  workEndMin?: number;
  hideWorkWindow?: boolean;
}

export function TimelineBar({
  record,
  workStartMin = WORK_START_MIN,
  workEndMin = WORK_END_MIN,
  hideWorkWindow = false,
}: Props) {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const checkIn = toMinutesUTC(record?.check_in_time ?? record?.check_in);
  const checkOut = toMinutesUTC(record?.check_out_time ?? record?.check_out);

  const effectiveStart = record?.scheduled_start ?? workStartMin;
  const effectiveEnd = record?.scheduled_end ?? workEndMin;

  const workStartPct = toPct(effectiveStart);
  const workEndPct = toPct(effectiveEnd);
  const segments =
    checkIn != null && checkOut != null
      ? buildSegments(checkIn, checkOut, effectiveStart, effectiveEnd)
      : [];

  const trackBg = dark ? 'rgba(255,255,255,0.06)' : '#f1f3f5';
  const windowBg = dark ? 'rgba(255,255,255,0.1)' : '#dee2e6';
  const tickMain = dark ? 'rgba(255,255,255,0.35)' : '#868e96';
  const tickSub = dark ? 'rgba(255,255,255,0.12)' : '#ced4da';

  return (
    <div style={{ position: 'relative', height: 24, width: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          height: 8,
          background: trackBg,
          borderRadius: 4,
        }}
      />

      {!hideWorkWindow && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: `${workStartPct}%`,
            width: `${workEndPct - workStartPct}%`,
            height: 8,
            borderRadius: 2,
            background: windowBg,
          }}
        />
      )}

      {segments.map((s, i) => (
        <Tooltip key={i} label={s.label} withArrow position="top">
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: `${s.left}%`,
              width: `${Math.max(s.width, 0.4)}%`,
              height: 12,
              borderRadius: 3,
              background: s.color,
              cursor: 'default',
              opacity: dark ? 0.85 : 1,
            }}
          />
        </Tooltip>
      ))}

      {TICK_LABELS.map(({ min }) => (
        <div
          key={min}
          style={{
            position: 'absolute',
            top: 4,
            left: `${toPct(min)}%`,
            width: 1,
            height: 16,
            background: min === effectiveStart || min === effectiveEnd ? tickMain : tickSub,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
