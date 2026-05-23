import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { IAward, IReviewCycle, IPerformanceReview, IEvaluationTemplate } from '../types';
import { URL_API_PERFORMANCES } from '@/constant/config';

export const useGetCycles = () =>
  useQuery<IReviewCycle[]>({
    queryKey: ['performance-cycles'],
    queryFn: () => apiClient.get(`${URL_API_PERFORMANCES}/cycles`).then((r) => r.data?.data ?? []),
  });

export const useGetMyCycles = () =>
  useQuery<IReviewCycle[]>({
    queryKey: ['my-performance-cycles'],
    queryFn: () =>
      apiClient.get(`${URL_API_PERFORMANCES}/my-cycles`).then((r) => r.data?.data ?? []),
  });

export const useGetCycle = (id: string) =>
  useQuery({
    queryKey: ['performance-cycle', id],
    queryFn: () => apiClient.get(`${URL_API_PERFORMANCES}/cycles/${id}`).then((r) => r.data?.data),
    enabled: !!id,
  });

export const useCreateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`${URL_API_PERFORMANCES}/cycles`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
  });
};

export const useUpdateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/cycles/${id}`, data).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['performance-cycles'] });
      qc.invalidateQueries({ queryKey: ['performance-cycle', vars.id] });
    },
  });
};

export const useGetReviewsByCycle = (cycleId: string) =>
  useQuery<IPerformanceReview[]>({
    queryKey: ['performance-reviews', cycleId],
    queryFn: () =>
      apiClient
        .get(`${URL_API_PERFORMANCES}/cycles/${cycleId}/reviews`)
        .then((r) => r.data?.data ?? []),
    enabled: !!cycleId,
  });

export const useGetMyReview = (cycleId: string) =>
  useQuery<IPerformanceReview | null>({
    queryKey: ['my-review', cycleId],
    queryFn: () =>
      apiClient
        .get(`${URL_API_PERFORMANCES}/cycles/${cycleId}/my-review`)
        .then((r) => r.data?.data),
    enabled: !!cycleId,
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`${URL_API_PERFORMANCES}/reviews`, data).then((r) => r.data),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['performance-reviews', vars.cycle_id] }),
  });
};

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/reviews/${id}/submit`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-reviews'] }),
  });
};

export const usePublishReviews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/cycles/${cycleId}/publish`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-cycles'] }),
  });
};

export const useGetAwardsByCycle = (cycleId: string) =>
  useQuery<IAward[]>({
    queryKey: ['awards', cycleId],
    queryFn: () =>
      apiClient
        .get(`${URL_API_PERFORMANCES}/cycles/${cycleId}/awards`)
        .then((r) => r.data?.data ?? []),
    enabled: !!cycleId,
  });

export const useCreateAward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`${URL_API_PERFORMANCES}/awards`, data).then((r) => r.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['awards', vars.cycle_id] }),
  });
};

export const useDeleteAward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`${URL_API_PERFORMANCES}/awards/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['awards'] }),
  });
};

export const useGetPendingReveal = () =>
  useQuery<IAward[]>({
    queryKey: ['pending-reveal'],
    queryFn: () =>
      apiClient
        .get(`${URL_API_PERFORMANCES}/awards/pending-reveal`)
        .then((r) => r.data?.data ?? []),
    staleTime: 0,
  });

export const useMarkRevealed = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (awardId: string) =>
      apiClient
        .post(`${URL_API_PERFORMANCES}/awards/${awardId}/mark-revealed`, {})
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-reveal'] }),
  });
};

export const useGetMyAwards = () =>
  useQuery<IAward[]>({
    queryKey: ['my-awards'],
    queryFn: () =>
      apiClient.get(`${URL_API_PERFORMANCES}/my-awards`).then((r) => r.data?.data ?? []),
  });

// ============ EVALUATION TEMPLATES ============
export const useGetTemplates = () =>
  useQuery<IEvaluationTemplate[]>({
    queryKey: ['evaluation-templates'],
    queryFn: () =>
      apiClient.get(`${URL_API_PERFORMANCES}/templates`).then((r) => r.data?.data ?? []),
  });

export const useGetTemplate = (id: string) =>
  useQuery<IEvaluationTemplate>({
    queryKey: ['evaluation-template', id],
    queryFn: () =>
      apiClient.get(`${URL_API_PERFORMANCES}/templates/${id}`).then((r) => r.data?.data),
    enabled: !!id,
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`${URL_API_PERFORMANCES}/templates`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluation-templates'] }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/templates/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluation-templates'] }),
  });
};

export const useToggleTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/templates/${id}/toggle`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluation-templates'] }),
  });
};

export const useCloneTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`${URL_API_PERFORMANCES}/templates/${id}/clone`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluation-templates'] }),
  });
};

// ============ EVALUATION CRITERIA ============
export const useCreateCriteria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ template_id, ...data }: any) =>
      apiClient
        .post(`${URL_API_PERFORMANCES}/templates/${template_id}/criteria`, data)
        .then((r) => r.data),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['evaluation-template', vars.template_id] }),
  });
};

export const useUpdateCriteria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, template_id, ...data }: any) =>
      apiClient.patch(`${URL_API_PERFORMANCES}/criteria/${id}`, data).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['evaluation-template', vars.template_id] });
      qc.invalidateQueries({ queryKey: ['evaluation-templates'] });
    },
  });
};

export const useDeleteCriteria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: any) =>
      apiClient.delete(`${URL_API_PERFORMANCES}/criteria/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluation-templates'] });
    },
  });
};
