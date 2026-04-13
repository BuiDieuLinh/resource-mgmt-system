export const EmployeeStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const LEAVE_TYPE = {
  ANNUAL: 'annual',
  SICK: 'sick',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  UNPAID: 'unpaid',
} as const;

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
};

export const LEAVE_TYPE_OPTIONS = Object.entries(LEAVE_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ATTENDANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const DAY_LIST = [
  { dow: 0, label: 'Monday', isWeekend: false },
  { dow: 1, label: 'Tuesday', isWeekend: false },
  { dow: 2, label: 'Wednesday', isWeekend: false },
  { dow: 3, label: 'Thursday', isWeekend: false },
  { dow: 4, label: 'Friday', isWeekend: false },
  { dow: 5, label: 'Saturday', isWeekend: true },
  { dow: 6, label: 'Sunday', isWeekend: true },
] as const;

export const DEFAULT_WORK_DAYS = [0, 1, 2, 3, 4]; // Mon–Fri
export const DEFAULT_START_TIME = 480; // 08:00
export const DEFAULT_END_TIME = 1020; // 17:00

// Date formatting — dd, MMM yyyy e.g. 25, Mar 2026
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
  return `${day}, ${mon} ${year}`;
}

export const DATE_FORMAT = 'DD, MMM YYYY';

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = (minutes % 60).toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export const LEVEL_OPTIONS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
];

export const LEVEL_POSITIONS = {
  JUNIOR: 'junior',
  MIDDLE: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  MANAGER: 'manager',
} as const;

export type LevelPosition = (typeof LEVEL_POSITIONS)[keyof typeof LEVEL_POSITIONS];

export const LEVEL_LABEL: Record<LevelPosition, string> = {
  junior: 'Junior',
  mid: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
  manager: 'Manager',
};

export const LEVEL_COLOR: Record<LevelPosition, string> = {
  junior: 'teal',
  mid: 'blue',
  senior: 'violet',
  lead: 'orange',
  manager: 'red',
};

export const EMPLOYEE_ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_LOCALE = 'vi-VN';
