import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface HeadcountMonth {
  month: number;
  label: string;
  headcount: number;
  new_hires: number;
}

export interface DepartmentBreakdown {
  id: string;
  name: string;
  total: number;
  active: number;
  inactive: number;
  levels: Record<string, number>;
}

export interface AttendanceMonth {
  month: number;
  label: string;
  attendance_rate: number;
  late_rate: number;
  overtime_hours: number;
  avg_work_hours: number;
  total_records: number;
}

export interface LeaveMonth {
  month: number;
  label: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  annual?: number;
  sick?: number;
  maternity?: number;
  paternity?: number;
  unpaid?: number;
}

export interface QuarterlySummary {
  quarter: string;
  attendance_rate: number;
  overtime_hours: number;
  leave_requests: number;
}

export interface AnalyticsOverview {
  year: number;
  summary: {
    total_employees: number;
    active: number;
    inactive: number;
    new_hires_this_year: number;
    departments: number;
  };
  headcount_by_month: HeadcountMonth[];
  department_breakdown: DepartmentBreakdown[];
  attendance_by_month: AttendanceMonth[];
  leave_by_month: LeaveMonth[];
  quarterly_summary: QuarterlySummary[];
}

const getAnalyticsOverview = async (year: number): Promise<AnalyticsOverview> => {
  const res = await apiClient.get('/analytics/overview', { params: { year } });
  return res.data?.data ?? res.data;
};

export const useGetAnalyticsOverview = (year: number) => {
  return useQuery({
    queryKey: ['analytics', 'overview', year],
    queryFn: () => getAnalyticsOverview(year),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
