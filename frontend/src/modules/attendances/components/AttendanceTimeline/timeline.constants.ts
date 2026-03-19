// Grid column widths — shared between TimelineHeader and DayRow
export const COL_DATE = 90;
export const COL_TIME = 110;
export const COL_BADGE = 150;

// Visible timeline window (minutes since midnight)
export const TIMELINE_START = 7 * 60; // 07:00
export const TIMELINE_END = 19 * 60; // 19:00 — covers overtime
export const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;
export const WORK_START_MIN = 8 * 60; // 08:00 standard start
export const WORK_END_MIN = 17 * 60; // 17:00 standard end

export const TICK_LABELS = [
  { min: 7 * 60, label: '07:00' },
  { min: 8 * 60, label: '08:00' },
  { min: 10 * 60, label: '10:00' },
  { min: 12 * 60, label: '12:00' },
  { min: 14 * 60, label: '14:00' },
  { min: 17 * 60, label: '17:00' },
  { min: 19 * 60, label: '19:00' },
] as const;

/** Map a minute value to % position within the visible timeline */
export function toPct(min: number): number {
  return Math.max(0, Math.min(100, ((min - TIMELINE_START) / TIMELINE_SPAN) * 100));
}

/** Parse UTC ISO timestamp → minutes since midnight (UTC) */
export function toMinutesUTC(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
