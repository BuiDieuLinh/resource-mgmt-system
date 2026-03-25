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
