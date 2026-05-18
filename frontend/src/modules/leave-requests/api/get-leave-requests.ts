import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import type { ILeaveRequest } from '../types';
import { leaveRequestKeys } from './keys';

interface GetLeaveRequestsParams {
  employee_id?: string;
  status?: string;
  department_id?: string;
  leave_type?: string;
  pageIndex?: number;
  pageSize?: number;
  month?: number;
  year?: number;
}

interface LeaveRequestsPagedResponse {
  data: { data: ILeaveRequest[]; count: number; pageIndex: number; pageSize: number };
  error: boolean;
  message: string;
}

const getLeaveRequests = async (
  params: GetLeaveRequestsParams,
): Promise<{ data: ILeaveRequest[]; count: number; pageIndex: number; pageSize: number }> => {
  const res = await apiClient.get<LeaveRequestsPagedResponse>(URL_API_LEAVE_REQUESTS, { params });
  return res.data?.data;
};

export const useGetLeaveRequests = (
  params?: GetLeaveRequestsParams,
  config?: Omit<
    UseQueryOptions<
      { data: ILeaveRequest[]; count: number; pageIndex: number; pageSize: number },
      Error,
      { data: ILeaveRequest[]; count: number; pageIndex: number; pageSize: number },
      readonly unknown[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: leaveRequestKeys.list(params),
    queryFn: () => getLeaveRequests(params ?? {}),
    ...config,
  });
};
