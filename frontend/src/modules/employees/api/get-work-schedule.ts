import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IWorkSchedule } from '../types';

interface WorkScheduleResponse {
  data: IWorkSchedule | null;
  error: boolean;
  message: string;
}

const getWorkSchedule = async (employeeId: string): Promise<WorkScheduleResponse> => {
  const res = await apiClient.get(`employees/${employeeId}/work-schedule`);
  return res.data;
};

export const useGetWorkSchedule = (employeeId: string) =>
  useQuery({
    queryKey: ['work-schedule', employeeId],
    queryFn: () => getWorkSchedule(employeeId),
    enabled: !!employeeId,
  });
