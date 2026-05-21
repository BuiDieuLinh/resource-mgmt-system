import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import type { IEmployee } from '../types';

interface UpdateEmployeeResponse {
  data: IEmployee;
  error: boolean;
  message: string;
  timestamp: string;
}

const updateRegisteredFaceDescriptor = async (
  id: string,
  payload: { face_descriptor: number[] },
): Promise<UpdateEmployeeResponse> => {
  const res = await apiClient.patch(`${URL_API_GET_EMPLOYEES}/${id}/face-descriptor`, payload);
  return res.data;
};

export const useUpdateRegisteredFaceDescriptor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { face_descriptor: number[] } }) =>
      updateRegisteredFaceDescriptor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
