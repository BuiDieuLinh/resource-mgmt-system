import dayjs from 'dayjs';

export function getMonthRange(month: number, year: number) {
  return {
    gte: dayjs(`${year}-${month}-01`).startOf('month').toDate(),
    lte: dayjs(`${year}-${month}-01`).endOf('month').toDate(),
  };
}

export function getWorkingDaysInMonth(month: number, year: number): number {
  const start = dayjs(`${year}-${month}-01`).startOf('month');
  const daysInMonth = start.daysInMonth();
  let count = 0;
  for (let d = 0; d < daysInMonth; d++) {
    const day = start.add(d, 'day').day();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/** "HH:mm" → minutes from midnight */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** minutes from midnight → "HH:mm" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** DateTime → minutes from midnight (local) */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Calculate overlap in minutes between two intervals [aStart, aEnd] and [bStart, bEnd].
 * Returns 0 if no overlap.
 */
export function overlapMinutes(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}
