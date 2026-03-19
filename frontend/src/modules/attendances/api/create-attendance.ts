import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import type { IAttendance, IAttendancePayload, IAttendanceRequest } from '../types';
import { attendancesKeys } from './keys';

export interface CreateAttendanceResponse {
  data: IAttendance;
  error?: boolean;
  message?: string;
  timestamp?: string;
}

const createAttendance = async (
  payload: IAttendancePayload,
): Promise<CreateAttendanceResponse | IAttendance> => {
  const requestData: IAttendanceRequest = {
    employee_id: payload.employee_id,
    work_date: payload.date,
    check_in_time: payload.check_in,
    check_out_time: payload.check_out,
    check_in_lat: payload.check_in_lat,
    check_in_lng: payload.check_in_lng,
    check_out_lat: payload.check_out_lat,
    check_out_lng: payload.check_out_lng,
    late: payload.late,
    status: payload.status?.toLowerCase(),
    device_id: payload.device_id,
  };

  const res = await apiClient.post(URL_API_GET_ATTENDANCES, requestData);
  return res.data;
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
