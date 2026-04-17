import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IAward, IReviewCycle, IPerformanceReview } from '../types';

const BASE = 'performance';

export const useGetCycles = () =>
  useQuery<IReviewCycle[]>({
    queryKey: ['performance-cycles'],
    queryFn: () => apiClient.get(`${BASE}/cycles`).then((r) => r.data?.data ?? []),
  });

export const useGetCycle = (id: string) =>
  useQuery({
    queryKey: ['performance-cycle', id],
    queryFn: () => apiClient.get(`${BASE}/cycles/${id}`).then((r) => r.data?.data),
    enabled: !!id,
  });

export const useCreateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      console.log('🚀 useCreateCycle calling API with:', data);
      return apiClient.post(`${BASE}/cycles`, data).then((r) => {
        console.log('✅ useCreateCycle response:', r.data);
        return r.data;
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
    onError: (e: any) => {
      console.error('❌ useCreateCycle error:', e?.response?.data ?? e?.message);
    },
  });
};

export const useGetReviewsByCycle = (cycleId: string) =>
  useQuery<IPerformanceReview[]>({
    queryKey: ['performance-reviews', cycleId],
    queryFn: () =>
      apiClient.get(`${BASE}/cycles/${cycleId}/reviews`).then((r) => r.data?.data ?? []),
    enabled: !!cycleId,
  });

export const useGetMyReview = (cycleId: string) =>
  useQuery<IPerformanceReview | null>({
    queryKey: ['my-review', cycleId],
    queryFn: () => apiClient.get(`${BASE}/cycles/${cycleId}/my-review`).then((r) => r.data?.data),
    enabled: !!cycleId,
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(`${BASE}/reviews`, data).then((r) => r.data),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['performance-reviews', vars.cycle_id] }),
  });
};

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiClient.patch(`${BASE}/reviews/${id}/submit`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-reviews'] }),
  });
};

export const usePublishReviews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) =>
      apiClient.patch(`${BASE}/cycles/${cycleId}/publish`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
  });
};

export const useGetAwardsByCycle = (cycleId: string) =>
  useQuery<IAward[]>({
    queryKey: ['awards', cycleId],
    queryFn: () =>
      apiClient.get(`${BASE}/cycles/${cycleId}/awards`).then((r) => r.data?.data ?? []),
    enabled: !!cycleId,
  });

export const useCreateAward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(`${BASE}/awards`, data).then((r) => r.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['awards', vars.cycle_id] }),
  });
};

export const useDeleteAward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${BASE}/awards/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['awards'] }),
  });
};

export const useGetPendingReveal = () =>
  useQuery<IAward[]>({
    queryKey: ['pending-reveal'],
    queryFn: () => apiClient.get(`${BASE}/awards/pending-reveal`).then((r) => r.data?.data ?? []),
    staleTime: 0,
  });

export const useMarkRevealed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (awardId: string) =>
      apiClient.post(`${BASE}/awards/${awardId}/mark-revealed`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-reveal'] }),
  });
};

export const useGetMyAwards = () =>
  useQuery<IAward[]>({
    queryKey: ['my-awards'],
    queryFn: () => apiClient.get(`${BASE}/my-awards`).then((r) => r.data?.data ?? []),
  });
