/**
 * Leave Request Models
 */

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  PERSONAL = 'personal',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  STUDY = 'study',
}

export enum LeaveRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType | string;
  reason: string;
  status: LeaveRequestStatus | string;
  approved_by_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLeaveRequestRequest {
  start_date: string;
  end_date: string;
  leave_type: LeaveType | string;
  reason: string;
  attachment_url?: string;
}

export interface UpdateLeaveRequestRequest {
  start_date?: string;
  end_date?: string;
  leave_type?: LeaveType | string;
  reason?: string;
  status?: LeaveRequestStatus | string;
  rejection_reason?: string;
}

export interface LeaveRequestResponse {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: string;
  message: string;
}

export interface GetLeaveRequestsRequest {
  start_date?: string;
  end_date?: string;
  status?: string;
  leave_type?: string;
  employee_id?: string;
  page?: number;
  limit?: number;
}

export interface GetLeaveRequestsResponse {
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LeaveBalance {
  leave_type: LeaveType | string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}

export interface LeaveBalanceResponse {
  data: LeaveBalance[];
  employee_id: string;
}
