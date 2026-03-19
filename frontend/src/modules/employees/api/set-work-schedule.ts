import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IWorkSchedule } from '../types';

const setWorkSchedule = async (employeeId: string, payload: IWorkSchedule) => {
  const res = await apiClient.put(`employees/${employeeId}/work-schedule`, payload);
  return res.data;
};

export const useSetWorkSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: string; payload: IWorkSchedule }) =>
      setWorkSchedule(employeeId, payload),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['work-schedule', employeeId] });
    },
  });
};
