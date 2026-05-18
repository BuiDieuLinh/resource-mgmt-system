import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/constant';

export interface CheckInOutPayload {
  employee_id: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

interface CheckInOutResponse {
  data: any;
  error: boolean;
  message: string;
}

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInOutPayload): Promise<CheckInOutResponse> =>
      apiClient.post(`${API_ENDPOINTS.ATTENDANCES}/check-in`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};

export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInOutPayload): Promise<CheckInOutResponse> =>
      apiClient.post(`${API_ENDPOINTS.ATTENDANCES}/check-out`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};
