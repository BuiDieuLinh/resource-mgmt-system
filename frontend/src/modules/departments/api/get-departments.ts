import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IDepartment } from '../types';
import { URL_API_GET_DEPARTMENTS } from '@/constant/config';

interface DepartmentsResponse {
  data: IDepartment[];
  count: number;
  error: boolean;
  message: string;
  timestamp: string;
}

interface GetDepartmentsParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
}

const getDepartments = async (params: GetDepartmentsParams = {}): Promise<DepartmentsResponse> => {
  const res = await apiClient.get(URL_API_GET_DEPARTMENTS, { params });
  return res.data.data;
};

export const useGetDepartments = (
  params: GetDepartmentsParams = {},
  config?: Omit<
    UseQueryOptions<
      DepartmentsResponse,
      Error,
      DepartmentsResponse,
      [string, GetDepartmentsParams]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<DepartmentsResponse, Error, DepartmentsResponse, [string, GetDepartmentsParams]>({
    queryKey: ['departments', params],
    queryFn: () => getDepartments(params),
    ...config,
  });
};

export const useGetAllDepartments = () => {
  return useGetDepartments({ pageSize: 1000 }, { staleTime: 5 * 60 * 1000 });
};
