import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import { attendancesKeys } from './keys';

export interface AttendanceSummariesResponse {
  data: any[];
  count?: number;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

interface GetAttendanceSummariesParams {
  month: number;
  year: number;
}

const getAttendanceSummaries = async (params: GetAttendanceSummariesParams): Promise<any[]> => {
  const res = await apiClient.get<any[] | AttendanceSummariesResponse>(
    `${URL_API_GET_ATTENDANCES}/summary`,
    { params },
  );
  return Array.isArray(res.data) ? res.data : (res.data as AttendanceSummariesResponse).data;
};

export const useGetAttendanceSummaries = (
  params: GetAttendanceSummariesParams,
  config?: Omit<UseQueryOptions<any[], Error, any[], readonly unknown[]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<any[], Error, any[], readonly unknown[]>({
    queryKey: attendancesKeys.summaries(params),
    queryFn: () => getAttendanceSummaries(params),
    ...config,
  });
};
