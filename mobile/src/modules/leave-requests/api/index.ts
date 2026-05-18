import { API_ENDPOINTS } from '@/index';
import { apiClient } from '@/lib/api';
import type { LeaveRequest } from '@/models/leave-requests';
import type { ApiResponse } from '@/models/common';

export interface CreateLeaveRequestDto {
  start_date: string;
  end_date: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid';
  reason?: string;
  leave_start_minutes?: number;
  leave_end_minutes?: number;
}

export const getMyLeaveRequests = async (status?: string): Promise<ApiResponse<LeaveRequest[]>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.LEAVE_REQUESTS}/my`, {
    params: status ? { status } : undefined,
  });
  return res.data;
};

export const createLeaveRequest = async (
  data: CreateLeaveRequestDto,
): Promise<ApiResponse<LeaveRequest>> => {
  const res = await apiClient.post(`${API_ENDPOINTS.LEAVE_REQUESTS}`, data);
  return res.data;
};

export const getLeaveRequestById = async (id: string): Promise<ApiResponse<LeaveRequest>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.LEAVE_REQUESTS}/${id}`);
  return res.data;
};

export const deleteLeaveRequest = async (id: string): Promise<ApiResponse<void>> => {
  const res = await apiClient.delete(`${API_ENDPOINTS.LEAVE_REQUESTS}/${id}`);
  return res.data;
};
