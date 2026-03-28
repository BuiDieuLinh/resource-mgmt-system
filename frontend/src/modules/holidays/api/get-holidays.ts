import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_HOLIDAYS } from '@/constant/config';
import type { IHoliday } from '../types';
import { holidayKeys } from './keys';

interface HolidaysResponse {
  data: IHoliday[];
  error: boolean;
  message: string;
  timestamp: string;
}

interface GetHolidaysParams {
  year?: string;
}

const getHolidays = async (params: GetHolidaysParams): Promise<HolidaysResponse> => {
  const res = await apiClient.get(URL_API_HOLIDAYS, { params });
  return res.data;
};

export const useGetHolidays = (
  params?: GetHolidaysParams,
  config?: Omit<
    UseQueryOptions<HolidaysResponse, Error, HolidaysResponse, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<HolidaysResponse, Error, HolidaysResponse, readonly unknown[]>({
    queryKey: holidayKeys.list(params),
    queryFn: () => getHolidays(params ?? {}),
    ...config,
  });
};
