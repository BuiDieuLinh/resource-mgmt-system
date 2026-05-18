import { API_ENDPOINTS } from '@/constant';
import { apiClient } from '@/lib/api';
import type { Employee } from '@/models/employees';
import type { ApiResponse, PaginatedResponse } from '@/models/common';
import { useQuery } from '@tanstack/react-query';

export const getEmployeeByUser = async (): Promise<ApiResponse<Employee>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.EMPLOYEES}/by-user`);
  return res.data;
};

export const getEmployees = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
  position_id?: string;
  status?: string;
}): Promise<PaginatedResponse<Employee>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.EMPLOYEES}`, { params });
  return res.data;
};

export const getEmployeeById = async (id: string): Promise<ApiResponse<Employee>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.EMPLOYEES}/${id}`);
  return res.data;
};

export const getEmployeeWorkSchedule = async (id: string): Promise<ApiResponse<any>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.EMPLOYEES}/${id}/work-schedule`);
  return res.data;
};

export const useGetEmployeeByUser = () => {
  return useQuery({
    queryKey: ['employee', 'by-user'],
    queryFn: getEmployeeByUser,
    staleTime: 1000 * 60 * 5,
  });
};
