import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_POSITIONS } from '@/constant/config';
import type { IPosition, IPositionPayload } from '../types';

interface UpdatePositionResponse {
  data: IPosition;
  error: boolean;
  message: string;
  timestamp: string;
}

const updatePosition = async (
  id: string,
  payload: Partial<IPositionPayload>,
): Promise<UpdatePositionResponse> => {
  const res = await apiClient.patch(`${URL_API_GET_POSITIONS}/${id}`, payload);
  return res.data;
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IPositionPayload> }) =>
      updatePosition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};
