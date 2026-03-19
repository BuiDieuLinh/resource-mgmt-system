import type { IAttendance, ILeaveRequest } from '../types';

export const formatDays = (val: number | string | undefined | null): string => {
  if (val === 0 || val === '0') return '-';
  if (!val) return '-';

  const num = Number(val);
  if (isNaN(num) || num === 0) return '-';

  if (Number.isInteger(num)) {
    return `${num} d`;
  }

  const [integerPart, decimalPart] = num.toString().split('.');
  return `${integerPart}d ${decimalPart}`;
};

export const formatHours = (val: number | string | undefined | null): string => {
  if (val === 0 || val === '0') return '-';
  if (!val) return '-';

  const num = Number(val);
  if (isNaN(num) || num === 0) return '-';

  if (Number.isInteger(num)) {
    return `${num}h`;
  }

  const [integerPart, decimalPart] = num.toString().split('.');
  return `${integerPart}h ${decimalPart}`;
};

export function fmtTime(iso?: string | null): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const total = new Date(year, month, 0).getDate();
  for (let d = 1; d <= total; d++) days.push(new Date(year, month - 1, d));
  return days;
}

export function getWeeksInMonth(year: number, month: number): Date[][] {
  const days = getDaysInMonth(year, month);
  const weeks: Date[][] = [];
  let week: Date[] = [];
  days.forEach((d) => {
    week.push(d);
    if (d.getDay() === 0 || d === days[days.length - 1]) {
      weeks.push(week);
      week = [];
    }
  });
  return weeks;
}

export function leaveOverlapsDay(lr: ILeaveRequest, day: Date): boolean {
  // parse date-only strings as local dates to avoid UTC offset issues
  const [sy, sm, sd] = lr.start_date.slice(0, 10).split('-').map(Number);
  const [ey, em, ed] = lr.end_date.slice(0, 10).split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return d >= start && d <= end;
}

export function exportAttendanceCsv(
  rows: IAttendance[],
  filename = `attendances_${Date.now()}.csv`,
) {
  const headers = [
    'Date',
    'Employee',
    'Check-in',
    'Check-out Lat/Lng',
    'Check-out',
    'Check-in Lat/Lng',
    'Status',
  ];

  const data = rows.map((r) => [
    r.date ? new Date(r.date).toLocaleDateString() : '',
    r.employee?.full_name || r.employee_id,
    r.check_in ? new Date(r.check_in).toLocaleTimeString() : '',
    r.check_in_lat && r.check_in_lng
      ? `${Number(r.check_in_lat).toFixed(4)},${Number(r.check_in_lng).toFixed(4)}`
      : '',
    r.check_out ? new Date(r.check_out).toLocaleTimeString() : '',
    r.check_out_lat && r.check_out_lng
      ? `${Number(r.check_out_lat).toFixed(4)},${Number(r.check_out_lng).toFixed(4)}`
      : '',
    r.status || '',
  ]);

  const csv = [headers, ...data]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
