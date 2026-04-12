import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import { leaveRequestKeys } from './keys';
import type { ILeaveRequestPayload } from '../types';

const updateLeaveRequest = async (id: string, payload: Partial<ILeaveRequestPayload>) => {
  const res = await apiClient.patch(`${URL_API_LEAVE_REQUESTS}/${id}`, payload);
  return res.data;
};

export const useUpdateLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<ILeaveRequestPayload>) =>
      updateLeaveRequest(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveRequestKeys.all }),
  });
};
