import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import type { ILeaveRequest } from '../types';
import { leaveRequestKeys } from './keys';

interface UpdateLeaveStatusResponse {
  data: ILeaveRequest;
  error: boolean;
  message: string;
  timestamp: string;
}

const updateLeaveStatus = async (
  id: string,
  status: string,
): Promise<UpdateLeaveStatusResponse> => {
  const res = await apiClient.patch(`${URL_API_LEAVE_REQUESTS}/${id}/status`, { status });
  return res.data;
};

export const useUpdateLeaveStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLeaveStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveRequestKeys.all }),
  });
};
