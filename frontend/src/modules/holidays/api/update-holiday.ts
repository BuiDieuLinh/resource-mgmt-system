import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_HOLIDAYS } from '@/constant/config';
import type { IHoliday, IHolidayPayload } from '../types';
import { holidayKeys } from './keys';

interface UpdateHolidayResponse {
  data: IHoliday;
  error: boolean;
  message: string;
  timestamp: string;
}

const updateHoliday = async (
  id: string,
  payload: Partial<IHolidayPayload>,
): Promise<UpdateHolidayResponse> => {
  const res = await apiClient.patch(`${URL_API_HOLIDAYS}/${id}`, payload);
  return res.data;
};

export const useUpdateHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IHolidayPayload> }) =>
      updateHoliday(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
};
