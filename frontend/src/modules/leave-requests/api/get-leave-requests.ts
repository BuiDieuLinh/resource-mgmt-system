import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import type { ILeaveRequest } from '../types';
import { leaveRequestKeys } from './keys';

interface LeaveRequestsResponse {
  data: ILeaveRequest[];
  error: boolean;
  message: string;
  timestamp: string;
}

interface GetLeaveRequestsParams {
  employee_id?: string;
  status?: string;
}

const getLeaveRequests = async (params: GetLeaveRequestsParams): Promise<LeaveRequestsResponse> => {
  const res = await apiClient.get(URL_API_LEAVE_REQUESTS, { params });
  return res.data;
};

export const useGetLeaveRequests = (
  params?: GetLeaveRequestsParams,
  config?: Omit<
    UseQueryOptions<LeaveRequestsResponse, Error, LeaveRequestsResponse, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<LeaveRequestsResponse, Error, LeaveRequestsResponse, readonly unknown[]>({
    queryKey: leaveRequestKeys.list(params),
    queryFn: () => getLeaveRequests(params ?? {}),
    ...config,
  });
};
