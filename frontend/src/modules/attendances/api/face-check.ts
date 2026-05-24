import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { attendancesKeys } from './keys';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IAttendance } from '../types';

export interface IFaceCheckData extends IAttendance {
  face_verified?: boolean;
  face_distance?: number;
  face_threshold?: number;
}

export interface FaceCheckResponse {
  data: IFaceCheckData;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

const faceCheckIn = async (formData: FormData): Promise<FaceCheckResponse> => {
  const res = await apiClient.post(`${URL_API_GET_ATTENDANCES}/check-in/face`, formData);
  return res.data;
};

const faceCheckOut = async (formData: FormData): Promise<FaceCheckResponse> => {
  const res = await apiClient.post(`${URL_API_GET_ATTENDANCES}/check-out/face`, formData);
  return res.data;
};

export const useFaceCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: faceCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};

export const useFaceCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: faceCheckOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
