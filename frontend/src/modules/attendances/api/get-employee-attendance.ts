import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IEmployeeAttendanceDetail } from '../types';
import { attendancesKeys } from './keys';

export const getEmployeeAttendance = async (
  employeeId: string,
  month: number,
  year: number,
): Promise<IEmployeeAttendanceDetail> => {
  const res = await apiClient.get(`${URL_API_GET_ATTENDANCES}/employee/${employeeId}`, {
    params: { month, year },
  });
  return res.data?.data ?? res.data;
};

export const useGetEmployeeAttendance = (
  employeeId: string,
  month: number,
  year: number,
  config?: Omit<UseQueryOptions<IEmployeeAttendanceDetail, Error>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: [...attendancesKeys.all, 'employee', employeeId, { month, year }],
    queryFn: () => getEmployeeAttendance(employeeId, month, year),
    enabled: !!employeeId,
    ...config,
  });
};
