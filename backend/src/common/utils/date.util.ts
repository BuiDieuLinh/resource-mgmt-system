import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = process.env.APP_TIMEZONE;

export function toLocalWorkDate(ts: Date): Date {
  const local = dayjs(ts).tz(APP_TZ);
  return new Date(Date.UTC(local.year(), local.month(), local.date()));
}

export function getMonthRange(month: number, year: number) {
  const mm = String(month).padStart(2, '0');
  return {
    gte: dayjs.utc(`${year}-${mm}-01`).startOf('month').toDate(),
    lte: dayjs.utc(`${year}-${mm}-01`).endOf('month').toDate(),
  };
}

export function getWorkingDaysInMonth(month: number, year: number): number {
  const start = dayjs(`${year}-${month}-01`).startOf('month');
  const daysInMonth = start.daysInMonth();
  let count = 0;
  for (let d = 0; d < daysInMonth; d++) {
    const cur = start.add(d, 'day');
    const dow = cur.day();
    const iso = cur.format('YYYY-MM-DD');
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function getWorkingDaysUpToToday(
  month: number,
  year: number,
  holidayDates: Set<string> = new Set(),
): number {
  const yesterday = dayjs().tz(APP_TZ).subtract(1, 'day').startOf('day');
  const start = dayjs
    .tz(`${year}-${String(month).padStart(2, '0')}-01`, APP_TZ)
    .startOf('month');
  const end = start.endOf('month');
  const cutoff = yesterday.isBefore(end) ? yesterday : end;
  if (cutoff.isBefore(start)) return 0;
  let count = 0;
  for (let d = start; !d.isAfter(cutoff); d = d.add(1, 'day')) {
    const iso = d.format('YYYY-MM-DD');
    if (d.day() !== 0 && d.day() !== 6 && !holidayDates.has(iso)) count++;
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

export function fmtDate(value: string | Date): string {
  const d = new Date(value);
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(/ /g, ' ');
}
