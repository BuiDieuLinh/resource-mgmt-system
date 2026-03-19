import type { AttendanceStatus, LeaveStatus, LeaveType } from '@/constant';

export interface IAttendance {
  id: string;
  employee_id: string;
  work_date?: string;
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
}

export interface ILeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
  status: LeaveStatus;
  approved_by?: string;
  created_at: string;
}

export interface IAttendanceSummary {
  plan_day: number;
  actual_day: number;
  late: number;
  absent: number;
  over_time: number;
}

export interface IEmployeeAttendanceDetail {
  employee: {
    id: string;
    full_name: string;
    display_name?: string;
    employee_code: string;
    department: { department_name: string };
    position: { position_name: string };
  };
  records: IAttendance[];
  leave_requests: ILeaveRequest[];
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
