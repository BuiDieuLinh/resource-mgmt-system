import { API_ENDPOINTS } from '@/index';
import { apiClient } from '@/lib/api';
import type { ReviewCycle, PerformanceReview, Award } from '@/models/performances';
import type { ApiResponse } from '@/models/common';
import { useQuery } from '@tanstack/react-query';

export const getMyCycles = async (): Promise<ApiResponse<ReviewCycle[]>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/my-cycles`);
  return res.data;
};

export const getCycleById = async (id: string): Promise<ApiResponse<ReviewCycle>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/cycles/${id}`);
  return res.data;
};

export const getMyReview = async (cycleId: string): Promise<ApiResponse<PerformanceReview>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/cycles/${cycleId}/my-review`);
  return res.data;
};

export const getMyAwards = async (): Promise<ApiResponse<Award[]>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/my-awards`);
  return res.data;
};

export const getPendingRevealAwards = async (): Promise<ApiResponse<Award[]>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/awards/pending-reveal`);
  return res.data;
};

export const getCycleAwards = async (cycleId: string): Promise<ApiResponse<Award[]>> => {
  const res = await apiClient.get(`${API_ENDPOINTS.PERFORMANCE}/cycles/${cycleId}/awards`);
  return res.data;
};

export const useGetMyCycles = () => {
  return useQuery({
    queryKey: ['performance', 'my-cycles'],
    queryFn: getMyCycles,
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetMyReview = (cycleId: string) => {
  return useQuery({
    queryKey: ['performance', 'my-review', cycleId],
    queryFn: () => getMyReview(cycleId),
    enabled: !!cycleId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetMyAwards = () => {
  return useQuery({
    queryKey: ['performance', 'my-awards'],
    queryFn: getMyAwards,
    staleTime: 1000 * 60 * 5,
  });
};
