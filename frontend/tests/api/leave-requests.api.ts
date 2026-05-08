import { apiCall } from './client';
import { log } from '../common/logger';

export interface LeaveRequestPayload {
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'unpaid';
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveRequest extends LeaveRequestPayload {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function createLeaveRequest(
  payload: LeaveRequestPayload,
  token: string,
): Promise<LeaveRequest> {
  log.step(`Create leave request for employee: ${payload.employee_id}`);
  const res = await apiCall<LeaveRequest>('leave-requests', {
    method: 'POST',
    body: payload,
    token,
  });
  log.ok(`Leave request created: ${(res.data as any).id}`);
  return res.data as LeaveRequest;
}

export async function deleteLeaveRequest(id: string, token: string): Promise<void> {
  log.step(`Delete leave request: ${id}`);
  await apiCall(`leave-requests/${id}`, { method: 'DELETE', token });
  log.ok(`Leave request deleted: ${id}`);
}
