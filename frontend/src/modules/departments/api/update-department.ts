import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_DEPARTMENTS } from '@/constant/config';
import type { IDepartment, IDepartmentPayload } from '../types';

interface UpdateDepartmentResponse {
  data: IDepartment;
  error: boolean;
  message: string;
  timestamp: string;
}

const updateDepartment = async (
  id: string,
  payload: Partial<IDepartmentPayload>,
): Promise<UpdateDepartmentResponse> => {
  const res = await apiClient.patch(`${URL_API_GET_DEPARTMENTS}/${id}`, payload);
  return res.data;
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IDepartmentPayload> }) =>
      updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
