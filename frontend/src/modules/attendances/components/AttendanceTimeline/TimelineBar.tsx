import { Tooltip } from '@mantine/core';
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
      color: '#ff6b6b',
      label: 'Late',
    });
  }

  const workEnd_ = Math.min(checkOut, workEnd);
  if (workEnd_ > checkIn) {
    segments.push({
      left: toPct(checkIn),
      width: toPct(workEnd_) - toPct(checkIn),
      color: isLate ? '#fd7e14' : '#12b886',
      label: 'Work',
    });
  }

  if (isEarlyLeave) {
    segments.push({
      left: toPct(checkOut),
      width: toPct(workEnd) - toPct(checkOut),
      color: '#fcc419',
      label: 'Early leave',
    });
  }

  if (hasOvertime) {
    segments.push({
      left: toPct(workEnd),
      width: toPct(checkOut) - toPct(workEnd),
      color: '#339af0',
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

  return (
    <div style={{ position: 'relative', height: 24, width: '100%' }}>
      {/* full track */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          height: 8,
          background: '#f1f3f5',
          borderRadius: 4,
        }}
      />

      {/* standard work window highlight */}
      {!hideWorkWindow && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: `${workStartPct}%`,
            width: `${workEndPct - workStartPct}%`,
            height: 8,
            borderRadius: 2,
            background: '#dee2e6',
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
            background: min === effectiveStart || min === effectiveEnd ? '#868e96' : '#ced4da',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
