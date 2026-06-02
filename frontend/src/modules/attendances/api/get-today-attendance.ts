import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface TodayAttendance {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
}

export interface TodayCheckInWindow {
  work_date: string;
  start_time: string;
  end_time: string;
  latest_check_in_time: string;
}

interface TodayAttendanceResponse {
  data: {
    attendance: TodayAttendance | null;
    can_check_in: boolean;
    disable_reason_code: string | null;
    check_in_window: TodayCheckInWindow | null;
    has_face_registered: boolean;
    is_office_ip_allowed: boolean;
    office_ip_check_skipped: boolean;
  };
  error: boolean;
  message: string;
}

const getTodayAttendance = async (employeeId: string): Promise<TodayAttendanceResponse> => {
  const res = await apiClient.get('attendances/today-status', {
    params: {
      employee_id: employeeId,
    },
  });
  return res.data;
};

export const useGetTodayAttendance = (employeeId: string | undefined) =>
  useQuery({
    queryKey: ['attendance-today', employeeId],
    queryFn: () => getTodayAttendance(employeeId!),
    enabled: !!employeeId,
    refetchInterval: 30000, // refresh every 30s
  });
