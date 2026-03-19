import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import { attendancesKeys } from './keys';

const updateLeaveRequest = async (id: string, status: 'approved' | 'rejected') => {
  const res = await apiClient.patch(`${URL_API_GET_ATTENDANCES}/leave-requests/${id}`, { status });
  return res.data;
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      updateLeaveRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
