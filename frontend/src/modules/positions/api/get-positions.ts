import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IPosition } from '../types';
import { URL_API_GET_POSITIONS } from '@/constant/config';

interface PositionsResponse {
  data: IPosition[];
  count: number;
  error: boolean;
  message: string;
  timestamp: string;
}

interface GetPositionsParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  department_id?: string;
}

const getPositions = async (
  params: GetPositionsParams = {}
): Promise<PositionsResponse> => {
  const res = await apiClient.get(URL_API_GET_POSITIONS, { params });
  return res.data.data;
};

export const useGetPositions = (
  params: GetPositionsParams = {},
  config?: Omit<
    UseQueryOptions<
      PositionsResponse,
      Error,
      PositionsResponse,
      [string, GetPositionsParams]
    >,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<
    PositionsResponse,
    Error,
    PositionsResponse,
    [string, GetPositionsParams]
  >({
    queryKey: ['positions', params],
    queryFn: () => getPositions(params),
    ...config,
  });
};

export const useGetAllPositions = (department_id?: string) => {
  return useGetPositions(
    { pageSize: 1000, department_id }, 
    { 
      staleTime: 5 * 60 * 1000, 
      enabled: true, 
    }
  );
};
