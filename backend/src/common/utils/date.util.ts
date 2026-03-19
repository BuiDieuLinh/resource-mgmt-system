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
