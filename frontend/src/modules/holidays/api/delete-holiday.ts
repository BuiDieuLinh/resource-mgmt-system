import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_HOLIDAYS } from '@/constant/config';
import { holidayKeys } from './keys';

interface DeleteHolidayResponse {
  data: null;
  error: boolean;
  message: string;
  timestamp: string;
}

const deleteHoliday = async (id: string): Promise<DeleteHolidayResponse> => {
  const res = await apiClient.delete(`${URL_API_HOLIDAYS}/${id}`);
  return res.data;
};

export const useDeleteHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
  });
};
