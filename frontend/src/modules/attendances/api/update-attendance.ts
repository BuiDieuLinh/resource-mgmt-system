import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IAttendance, IAttendancePayload, IAttendanceRequest } from '../types';
import { attendancesKeys } from './keys';

export interface UpdateAttendanceResponse {
  data: IAttendance;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

const updateAttendance = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<IAttendancePayload>;
}): Promise<UpdateAttendanceResponse | IAttendance> => {
  const requestData: Partial<IAttendanceRequest> = {
    check_in_time: payload.check_in,
    check_out_time: payload.check_out,
    check_in_lat: payload.check_in_lat,
    check_in_lng: payload.check_in_lng,
    check_out_lat: payload.check_out_lat,
    check_out_lng: payload.check_out_lng,
    late: payload.late,
    status: payload.status?.toLowerCase(),
  };

  const res = await apiClient.patch(`${URL_API_GET_ATTENDANCES}/${id}`, requestData);
  return res.data;
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
