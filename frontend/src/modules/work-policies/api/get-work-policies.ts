import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_WORK_POLICIES } from '@/constant/config';
import type { IWorkPolicy } from '../types';
import { workPoliciesKeys } from './keys';

const getWorkPolicies = async (): Promise<{ data: IWorkPolicy[] }> => {
  const res = await apiClient.get(URL_API_WORK_POLICIES);
  return res.data;
};

export const useGetWorkPolicies = () =>
  useQuery({
    queryKey: workPoliciesKeys.all,
    queryFn: getWorkPolicies,
  });

const getActivePolicy = async (): Promise<{ data: IWorkPolicy | null }> => {
  const res = await apiClient.get(`${URL_API_WORK_POLICIES}/active`);
  return res.data;
};

export const useGetActivePolicy = () =>
  useQuery({
    queryKey: workPoliciesKeys.active(),
    queryFn: getActivePolicy,
  });
