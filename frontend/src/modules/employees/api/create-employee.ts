import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import type { IEmployee, IEmployeePayload } from '../types';

interface CreateEmployeeResponse {
  data: IEmployee;
  error: boolean;
  message: string;
  timestamp: string;
}

const createEmployee = async (
  payload: IEmployeePayload
): Promise<CreateEmployeeResponse> => {
  const res = await apiClient.post(URL_API_GET_EMPLOYEES, payload);
  return res.data;
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
