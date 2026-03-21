import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_WORK_POLICIES } from '@/constant/config';
import type { IWorkPolicyPayload } from '../types';
import { workPoliciesKeys } from './keys';

const createWorkPolicy = async (payload: IWorkPolicyPayload) => {
  const res = await apiClient.post(URL_API_WORK_POLICIES, payload);
  return res.data;
};

export const useCreateWorkPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workPoliciesKeys.all }),
  });
};
