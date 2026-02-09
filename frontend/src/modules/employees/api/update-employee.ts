import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import type { IEmployee, IEmployeePayload } from '../types';

interface UpdateEmployeeResponse {
  data: IEmployee;
  error: boolean;
  message: string;
  timestamp: string;
}

const updateEmployee = async (
  id: string,
  payload: Partial<IEmployeePayload>
): Promise<UpdateEmployeeResponse> => {
  const res = await apiClient.patch(`${URL_API_GET_EMPLOYEES}/${id}`, payload);
  return res.data;
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IEmployeePayload> }) =>
      updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
