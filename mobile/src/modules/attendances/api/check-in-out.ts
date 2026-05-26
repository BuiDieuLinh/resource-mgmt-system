import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/constant';

export interface CheckInOutPayload {
  employee_id: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

export interface FaceCheckPayload {
  employee_id: string;
  face_descriptor: number[];
  selfieUri: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

interface CheckInOutResponse {
  data: any;
  error: boolean;
  message: string;
}

interface FaceCheckResponse {
  data: any;
  status: number;
  message: string;
}

const buildFaceFormData = (payload: FaceCheckPayload) => {
  const formData = new FormData();

  formData.append('employee_id', payload.employee_id);
  formData.append('timestamp', payload.timestamp ?? new Date().toISOString());
  formData.append('face_descriptor', JSON.stringify(payload.face_descriptor));

  if (payload.latitude != null) {
    formData.append('latitude', String(payload.latitude));
  }

  if (payload.longitude != null) {
    formData.append('longitude', String(payload.longitude));
  }

  formData.append('selfie', {
    uri: payload.selfieUri,
    name: 'face-selfie.jpg',
    type: 'image/jpeg',
  } as any);

  return formData;
};

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInOutPayload): Promise<CheckInOutResponse> =>
      apiClient.post(`${API_ENDPOINTS.ATTENDANCES}/check-in`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};

export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInOutPayload): Promise<CheckInOutResponse> =>
      apiClient.post(`${API_ENDPOINTS.ATTENDANCES}/check-out`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};

export const useFaceCheckIn = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: FaceCheckPayload): Promise<FaceCheckResponse> =>
      apiClient
        .post(`${API_ENDPOINTS.ATTENDANCES}/check-in/face`, buildFaceFormData(payload), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};

export const useFaceCheckOut = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: FaceCheckPayload): Promise<FaceCheckResponse> =>
      apiClient
        .post(`${API_ENDPOINTS.ATTENDANCES}/check-out/face`, buildFaceFormData(payload), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances', 'my'] }),
  });
};
