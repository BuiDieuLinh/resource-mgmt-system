import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IEmployeeAttendanceDetail } from '../types';

const getMyAttendance = async (month: number, year: number): Promise<IEmployeeAttendanceDetail> => {
  const res = await apiClient.get(`${URL_API_GET_ATTENDANCES}/my`, { params: { month, year } });
  return res.data?.data ?? res.data;
};

export const useGetMyAttendance = (month: number, year: number) => {
  return useQuery({
    queryKey: ['attendances', 'my', { month, year }],
    queryFn: () => getMyAttendance(month, year),
  });
};
