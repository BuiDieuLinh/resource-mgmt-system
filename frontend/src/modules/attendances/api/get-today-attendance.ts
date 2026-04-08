import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface TodayAttendance {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
}

interface TodayAttendanceResponse {
  data: TodayAttendance | null;
  error: boolean;
  message: string;
}

const getTodayAttendance = async (employeeId: string): Promise<TodayAttendanceResponse> => {
  const today = new Date();
  const res = await apiClient.get('attendances', {
    params: {
      employee_id: employeeId,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    },
  });
  // Find today's record from the list
  const body = res.data;
  const list = body?.data?.data ?? body?.data ?? [];
  const todayStr = today.toISOString().slice(0, 10);
  const record = Array.isArray(list)
    ? (list.find((r: any) => r.work_date?.slice(0, 10) === todayStr) ?? null)
    : null;
  return { data: record, error: false, message: '' };
};

export const useGetTodayAttendance = (employeeId: string | undefined) =>
  useQuery({
    queryKey: ['attendance-today', employeeId],
    queryFn: () => getTodayAttendance(employeeId!),
    enabled: !!employeeId,
    refetchInterval: 30000, // refresh every 30s
  });
