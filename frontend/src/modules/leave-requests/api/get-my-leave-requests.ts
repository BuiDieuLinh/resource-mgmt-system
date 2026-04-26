import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import type { ILeaveRequest } from '../types';
import { leaveRequestKeys } from './keys';

interface MyLeaveRequestsResponse {
  data: ILeaveRequest[];
  error: boolean;
  message: string;
}

const getMyLeaveRequests = async (status?: string): Promise<MyLeaveRequestsResponse> => {
  const res = await apiClient.get(`${URL_API_LEAVE_REQUESTS}/my`, {
    params: status ? { status } : undefined,
  });
  return res.data;
};

export const useGetMyLeaveRequests = (status?: string) => {
  return useQuery({
    queryKey: leaveRequestKeys.list({ scope: 'my', status }),
    queryFn: () => getMyLeaveRequests(status),
  });
};
