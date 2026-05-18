import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/constant/config';
import type { IEmployeeAttendanceDetail } from '@/models/attendances';

const getMyAttendance = async (month: number, year: number): Promise<IEmployeeAttendanceDetail> => {
  const res = await apiClient.get(`${API_ENDPOINTS.ATTENDANCES}/my`, {
    params: {
      month,
      year,
    },
  });
  return res.data.data;
};

export const useGetMyAttendance = (month: number, year: number) => {
  return useQuery({
    queryKey: ['attendances', 'my', month, year],

    queryFn: () => getMyAttendance(month, year),

    staleTime: 1000 * 60 * 5,
  });
};
