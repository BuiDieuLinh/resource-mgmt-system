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

const getEmployeeByUserId = async (): Promise<EmployeeByUserResponse> => {
  const res = await apiClient.get(`${URL_API_GET_EMPLOYEES}/by-user`);
  return res.data;
};

export const useGetEmployeeByUserId = () =>
  useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeByUserId(),
  });
