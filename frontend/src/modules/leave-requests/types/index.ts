import type { LeaveType, LeaveStatus } from '../../../constant';

export interface IAnnualLeaveBalance {
  annual_leave_days: number;
  year: number;
  quarter: number;
  entitled_days: number;
  used_days: number;
  pending_days?: number;
  requested_days?: number;
  remaining_days: number;
  remaining_after_request?: number;
  year_end_remaining_days?: number;
}

export interface ILeaveRequest {
  id: string;
  employee_id: string;
  employee?: { id: string; full_name: string; employee_code: string };
  approver_manager?: { id: string; full_name: string } | null;
  approver_admin?: { id: string; full_name: string } | null;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  leave_start_minutes?: number | null;
  leave_end_minutes?: number | null;
  reason?: string | null;
  status: LeaveStatus;
  approved_by_manager?: string | null;
  manager_approved_at?: string | null;
  manager_comment?: string | null;
  approved_by_admin?: string | null;
  admin_approved_at?: string | null;
  admin_comment?: string | null;
  created_at: string;
  annual_leave_balance?: IAnnualLeaveBalance | null;
}

export interface ILeaveRequestPayload {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  leave_start_minutes?: number;
  leave_end_minutes?: number;
  reason?: string;
}
