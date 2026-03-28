import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import { leaveRequestKeys } from './keys';

interface DeleteLeaveRequestResponse {
  data: null;
  error: boolean;
  message: string;
  timestamp: string;
}

const deleteLeaveRequest = async (id: string): Promise<DeleteLeaveRequestResponse> => {
  const res = await apiClient.delete(`${URL_API_LEAVE_REQUESTS}/${id}`);
  return res.data;
};

export const useDeleteLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveRequestKeys.all }),
  });
};
