import type { IAttendance, ILeaveRequest, IEmployeeAttendanceDetail } from '../types';

export function buildMockAttendanceDetail(year: number, month: number): IEmployeeAttendanceDetail {
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: number, h: number, m: number) =>
    `${year}-${pad(month)}-${pad(d)}T${pad(h)}:${pad(m)}:00.000Z`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const records: IAttendance[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0 || dow === 6) continue;

    const isLate = [3, 7, 12, 18, 22].includes(d);
    const isEarlyLeave = [9, 16, 24].includes(d);
    const isOvertime = [5, 10, 20].includes(d);
    const isAbsent = [15].includes(d);
    const isPending = [20, 21, 22].includes(d);

    if (isAbsent) continue;

    const checkInM = isLate ? 20 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 10);
    const checkOutH = isEarlyLeave ? 15 : isOvertime ? 18 : 17;
    const checkOutM = isEarlyLeave
      ? 30 + Math.floor(Math.random() * 60)
      : isOvertime
        ? Math.floor(Math.random() * 60)
        : Math.floor(Math.random() * 30);

    records.push({
      id: `mock-${d}`,
      employee_id: 'mock-emp-1',
      work_date: `${year}-${pad(month)}-${pad(d)}`,
      check_in_time: iso(d, 8, checkInM),
      check_out_time: iso(d, checkOutH, checkOutM % 60),
      late: isLate ? checkInM : 0,
      early_leave: isEarlyLeave ? 17 * 60 - (checkOutH * 60 + checkOutM) : 0,
      overtime: isOvertime ? checkOutH * 60 + checkOutM - 17 * 60 : 0,
      status: isPending ? 'pending' : 'approved',
    });
  }

  const leave_requests: ILeaveRequest[] = [
    {
      id: 'lr-1',
      employee_id: 'mock-emp-1',
      leave_type: 'annual',
      start_date: `${year}-${pad(month)}-05`,
      end_date: `${year}-${pad(month)}-07`,
      reason: 'Family trip',
      status: 'approved',
      created_at: `${year}-${pad(month)}-01T00:00:00.000Z`,
    },
    {
      id: 'lr-2',
      employee_id: 'mock-emp-1',
      leave_type: 'sick',
      start_date: `${year}-${pad(month)}-15`,
      end_date: `${year}-${pad(month)}-15`,
      reason: 'Fever and cold',
      status: 'pending',
      created_at: `${year}-${pad(month)}-14T00:00:00.000Z`,
    },
  ];

  const planDay = Math.round((daysInMonth * 5) / 7);
  const actualDay = records.filter((r) => r.status === 'approved').length;

  return {
    employee: {
      id: 'mock-emp-1',
      full_name: 'Nguyễn Văn An',
      display_name: 'An Nguyen',
      employee_code: 'EMP-001',
      department: { department_name: 'Engineering' },
      position: { position_name: 'Frontend Developer' },
    },
    records,
    leave_requests,
    summary: {
      plan_day: planDay,
      actual_day: actualDay,
      late: records.filter((r) => (r.late ?? 0) > 0).length,
      absent: planDay - actualDay,
      over_time: records.reduce((s, r) => s + (r.overtime ?? 0), 0) / 60,
    },
  };
}
