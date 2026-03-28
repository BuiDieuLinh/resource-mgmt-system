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
  const res = await apiClient.get<any>(URL_API_GET_ATTENDANCES, { params });
  const body = res.data;

  const inner = body?.data ?? body;

  if (inner && !Array.isArray(inner) && Array.isArray(inner.data)) {
    return inner.data;
  }

  return Array.isArray(inner) ? inner : [];
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
