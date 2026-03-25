import type { IWorkSchedule } from '../types';

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalMin = i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return { value: String(totalMin), label: `${hh}:${mm} ${ampm}` };
});

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = (minutes % 60).toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export function buildSchedules(days: number[], start: number, end: number): IWorkSchedule[] {
  return days.map((dow) => ({ day_of_week: dow, start_time: start, end_time: end }));
}
