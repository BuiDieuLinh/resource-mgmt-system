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

function buildSegments(checkIn: number, checkOut: number): Segment[] {
  const segments: Segment[] = [];
  const isLate = checkIn > WORK_START_MIN;
  const isEarlyLeave = checkOut < WORK_END_MIN;
  const hasOvertime = checkOut > WORK_END_MIN;

  if (isLate) {
    segments.push({
      left: toPct(WORK_START_MIN),
      width: toPct(checkIn) - toPct(WORK_START_MIN),
      color: '#ff6b6b',
      label: 'Late',
    });
  }

  const workEnd = Math.min(checkOut, WORK_END_MIN);
  if (workEnd > checkIn) {
    segments.push({
      left: toPct(checkIn),
      width: toPct(workEnd) - toPct(checkIn),
      color: isLate ? '#fd7e14' : '#12b886',
      label: 'Work',
    });
  }

  if (isEarlyLeave) {
    segments.push({
      left: toPct(checkOut),
      width: toPct(WORK_END_MIN) - toPct(checkOut),
      color: '#fcc419',
      label: 'Early leave',
    });
  }

  if (hasOvertime) {
    segments.push({
      left: toPct(WORK_END_MIN),
      width: toPct(checkOut) - toPct(WORK_END_MIN),
      color: '#339af0',
      label: 'Overtime',
    });
  }

  return segments;
}

interface Props {
  record?: IAttendance;
}

export function TimelineBar({ record }: Props) {
  const checkIn = toMinutesUTC(record?.check_in_time ?? record?.check_in);
  const checkOut = toMinutesUTC(record?.check_out_time ?? record?.check_out);

  const workStartPct = toPct(WORK_START_MIN);
  const workEndPct = toPct(WORK_END_MIN);
  const segments = checkIn != null && checkOut != null ? buildSegments(checkIn, checkOut) : [];

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
            background: min === WORK_START_MIN || min === WORK_END_MIN ? '#868e96' : '#ced4da',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
