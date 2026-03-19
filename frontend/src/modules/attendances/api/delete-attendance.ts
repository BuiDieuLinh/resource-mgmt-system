import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import { attendancesKeys } from './keys';

export interface DeleteAttendanceResponse {
  data: any;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

const deleteAttendance = async (id: string): Promise<DeleteAttendanceResponse | any> => {
  const res = await apiClient.delete(`${URL_API_GET_ATTENDANCES}/${id}`);
  return res.data;
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
