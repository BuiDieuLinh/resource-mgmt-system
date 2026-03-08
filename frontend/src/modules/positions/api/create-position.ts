import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_POSITIONS } from '@/constant/config';
import type { IPosition, IPositionPayload } from '../types';

interface CreatePositionResponse {
  data: IPosition;
  error: boolean;
  message: string;
  timestamp: string;
}

const createPosition = async (payload: IPositionPayload): Promise<CreatePositionResponse> => {
  const res = await apiClient.post(URL_API_GET_POSITIONS, payload);
  return res.data;
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};
