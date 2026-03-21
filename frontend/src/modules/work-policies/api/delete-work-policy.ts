import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_WORK_POLICIES } from '@/constant/config';
import { workPoliciesKeys } from './keys';

const deleteWorkPolicy = async (id: string) => {
  const res = await apiClient.delete(`${URL_API_WORK_POLICIES}/${id}`);
  return res.data;
};

export const useDeleteWorkPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workPoliciesKeys.all }),
  });
};
