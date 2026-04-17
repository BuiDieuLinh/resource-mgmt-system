import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import type { IEmployee } from '../types';

interface EmployeeByUserResponse {
  data: IEmployee;
  error: boolean;
  message: string;
  timestamp: string;
}

const getEmployeeByUserId = async (userId: string): Promise<EmployeeByUserResponse> => {
  const res = await apiClient.get(`${URL_API_GET_EMPLOYEES}/by-user/${userId}`);
  return res.data;
};

export const useGetEmployeeByUserId = (userId: string | undefined) =>
  useQuery({
    queryKey: ['employees', userId],
    queryFn: () => getEmployeeByUserId(userId!),
    enabled: !!userId,
  });
