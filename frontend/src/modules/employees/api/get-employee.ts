import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import type { IEmployee } from '../types';

interface EmployeeResponse {
  data: IEmployee;
  error: boolean;
  message: string;
  timestamp: string;
}

const getEmployee = async (id: string): Promise<EmployeeResponse> => {
  const res = await apiClient.get(`${URL_API_GET_EMPLOYEES}/${id}`);
  return res.data;
};

export const useGetEmployee = (
  id: string,
  config?: Omit<
    UseQueryOptions<EmployeeResponse, Error, EmployeeResponse, [string, string]>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<EmployeeResponse, Error, EmployeeResponse, [string, string]>({
    queryKey: ['employee', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
    ...config,
  });
};
