import {
  COL_DATE,
  COL_TIME,
  COL_BADGE,
  TICK_LABELS,
  WORK_START_MIN,
  WORK_END_MIN,
  toPct,
} from './timeline.constants';

export function TimelineHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${COL_DATE}px ${COL_TIME}px 1fr ${COL_BADGE}px`,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div />
      <div />
      <div style={{ position: 'relative', height: 20 }}>
        {TICK_LABELS.map(({ min, label }) => (
          <span
            key={min}
            style={{
              position: 'absolute',
              left: `${toPct(min)}%`,
              transform: 'translateX(-50%)',
              fontSize: 10,
              whiteSpace: 'nowrap',
              color: min === WORK_START_MIN || min === WORK_END_MIN ? '#495057' : '#adb5bd',
              fontWeight: min === WORK_START_MIN || min === WORK_END_MIN ? 600 : 400,
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div />
    </div>
  );
}
