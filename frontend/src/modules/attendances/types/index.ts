import type { AttendanceAction, AttendanceStatus, LeaveStatus, LeaveType } from '@/constant';
import type { IAnnualLeaveBalance } from '@/modules/leave-requests/types';

export interface IAttendance {
  id: string;
  employee_id: string;
  work_date: string;
  scheduled_start?: number;
  scheduled_end?: number;
  break_start?: number | null;
  break_end?: number | null;
  check_in_time?: string;
  check_out_time?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  date?: string;
  check_in?: string;
  check_out?: string;
  check_in_place?: string;
  check_out_place?: string;
  late?: number;
  early_leave?: number;
  overtime?: number;
  work_minutes?: number;
  selfie_image_url?: string | null;
  similarity_score?: number | null;
  status?: AttendanceStatus;
  employee?: {
    id: string;
    full_name: string;
  };
  plan_day?: number;
  actual_day?: number;
  absent?: number;
  annual_leave?: number;
  unpaid_leave?: number;
  over_time?: number;
  logs: IAttendanceLogs[];
}

export interface IAttendanceLogs {
  id: string;
  timestamp: Date;
  attendance_id: string;
  action: AttendanceAction;
  latitude: number;
  longitude: number;
  ip_address: string | null;
  user_agent: string | null;
  selfie_image_url?: string | null;
  similarity_score?: number | null;
}

export interface ILeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  leave_start_minutes?: number | null;
  leave_end_minutes?: number | null;
  reason?: string;
  status: LeaveStatus;
  approved_by?: string;
  created_at: string;
  annual_leave_balance?: IAnnualLeaveBalance | null;
}

export interface IAttendanceSummary {
  plan_day: number;
  actual_day: number;
  late: number;
  absent: number;
  over_time: number;
}

export interface IWorkSchedule {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: number;
  end_time: number;
}

export interface IWorkPolicy {
  id: string;
  is_flexible_enabled: boolean;
  flexible_start?: number | null;
  flexible_end?: number | null;
  break_start?: number | null;
  break_end?: number | null;
  effective_from: string;
  effective_to?: string | null;
}

export interface IHoliday {
  id: string;
  name: string;
  holiday_date: string;
  description?: string | null;
  is_paid: boolean;
}

export interface IEmployeeAttendanceDetail {
  employee: {
    id: string;
    full_name: string;
    display_name?: string;
    employee_code: string;
    position: {
      position_name: string;
      department: {
        department_name: string;
      };
    };
  };
  records: IAttendance[];
  leave_requests: ILeaveRequest[];
  work_schedules: IWorkSchedule[];
  work_policy: IWorkPolicy | null;
  holidays: IHoliday[];
  annual_leave_balance?: IAnnualLeaveBalance | null;
  summary: IAttendanceSummary;
}

export interface IAttendancePayload {
  employee_id: string;
  date: string;
  check_in?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out?: string;
  check_out_lat?: number;
  check_out_lng?: number;
  status?: string;
  late?: number;
  device_id?: string;
}

export interface IAttendanceRequest {
  employee_id: string;
  work_date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  late?: number;
  status?: string;
  device_id?: string;
}
