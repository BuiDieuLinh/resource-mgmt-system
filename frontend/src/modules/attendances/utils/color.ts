import type { AttendanceStatus, LeaveStatus } from '@/constant';

export const LEAVE_STATUS_COLOR: Record<LeaveStatus, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

export const ATTENDANCE_STATUS_COLOR: Record<AttendanceStatus, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};
