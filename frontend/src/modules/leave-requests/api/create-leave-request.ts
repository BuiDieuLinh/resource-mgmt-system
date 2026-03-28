import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';
import { leaveRequestKeys } from './keys';

interface CreateLeaveRequestResponse {
  data: ILeaveRequest;
  error: boolean;
  message: string;
  timestamp: string;
}

const createLeaveRequest = async (
  payload: ILeaveRequestPayload,
): Promise<CreateLeaveRequestResponse> => {
  const res = await apiClient.post(URL_API_LEAVE_REQUESTS, payload);
  return res.data;
};

export const useCreateLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveRequestKeys.all }),
  });
};
