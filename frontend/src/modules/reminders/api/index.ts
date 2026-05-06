import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ReminderSetting {
  id: string;
  trigger_type: 'cycle_deadline' | 'cycle_unreviewed' | 'contract_ending';
  channel: 'inapp' | 'email' | 'dashboard';
  is_enabled: boolean;
  days_before: number | null;
  repeat_interval_days: number | null;
  updated_at: string;
}

export interface DashboardReminder {
  type: 'cycle_deadline' | 'cycle_unreviewed' | 'contract_ending';
  employee_id: string;
  employee_name: string;
  contract_type: string;
  days_remaining: number | null;
  cycle_id?: string;
  cycle_title?: string;
}

export const useGetReminderSettings = () =>
  useQuery<ReminderSetting[]>({
    queryKey: ['reminder-settings'],
    queryFn: () => apiClient.get('reminders/settings').then((r) => r.data?.data ?? []),
  });

export const useUpdateReminderSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReminderSetting> & { trigger_type: string; channel: string }) =>
      apiClient.patch('reminders/settings', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });
};

export const useGetDashboardReminders = () =>
  useQuery<DashboardReminder[]>({
    queryKey: ['dashboard-reminders'],
    queryFn: () => apiClient.get('reminders/dashboard').then((r) => r.data?.data ?? []),
    staleTime: 5 * 60 * 1000, // 5 min
  });
