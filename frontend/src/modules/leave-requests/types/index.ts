import type { LeaveType, LeaveStatus } from '../../../constant';

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
