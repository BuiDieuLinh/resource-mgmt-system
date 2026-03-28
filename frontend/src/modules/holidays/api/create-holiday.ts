import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_HOLIDAYS } from '@/constant/config';
import type { IHoliday, IHolidayPayload } from '../types';
import { holidayKeys } from './keys';

interface CreateHolidayResponse {
  data: IHoliday;
  error: boolean;
  message: string;
  timestamp: string;
}

const createHoliday = async (payload: IHolidayPayload): Promise<CreateHolidayResponse> => {
  const res = await apiClient.post(URL_API_HOLIDAYS, payload);
  return res.data;
};

export const useCreateHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
};
