import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_DEPARTMENTS } from '@/constant/config';
import type { IDepartment, IDepartmentPayload } from '../types';

interface CreateDepartmentResponse {
  data: IDepartment;
  error: boolean;
  message: string;
  timestamp: string;
}

const createDepartment = async (payload: IDepartmentPayload): Promise<CreateDepartmentResponse> => {
  const res = await apiClient.post(URL_API_GET_DEPARTMENTS, payload);
  return res.data;
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
