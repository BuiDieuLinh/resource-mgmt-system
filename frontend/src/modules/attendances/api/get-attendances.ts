import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IAttendance } from '../types';
import { attendancesKeys } from './keys';

export interface AttendancesResponse {
  data: IAttendance[];
  count?: number;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

interface GetAttendancesParams {
  month?: number;
  year?: number;
}

const getAttendances = async (params: GetAttendancesParams): Promise<IAttendance[]> => {
  const res = await apiClient.get<IAttendance[] | AttendancesResponse>(URL_API_GET_ATTENDANCES, {
    params,
  });
  return Array.isArray(res.data) ? res.data : (res.data as AttendancesResponse).data;
};

export const useGetAttendances = (
  params?: GetAttendancesParams,
  config?: Omit<
    UseQueryOptions<IAttendance[], Error, IAttendance[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
) => {
  const queryParams = params || {};
  return useQuery<IAttendance[], Error, IAttendance[], readonly unknown[]>({
    queryKey: attendancesKeys.list(queryParams),
    queryFn: () => getAttendances(queryParams),
    ...config,
  });
};
