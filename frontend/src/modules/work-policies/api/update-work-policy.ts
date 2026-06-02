import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_WORK_POLICIES } from '@/constant/config';
import type { IWorkPolicyUpdatePayload } from '../types';
import { workPoliciesKeys } from './keys';

const updateWorkPolicy = async ({
  id,
  payload,
}: {
  id: string;
  payload: IWorkPolicyUpdatePayload;
}) => {
  const res = await apiClient.patch(`${URL_API_WORK_POLICIES}/${id}`, payload);
  return res.data;
};

export const useUpdateWorkPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workPoliciesKeys.all }),
  });
};
