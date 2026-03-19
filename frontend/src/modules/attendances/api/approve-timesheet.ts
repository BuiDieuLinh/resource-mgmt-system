import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_GET_ATTENDANCES } from '@/constant/config';
import { attendancesKeys } from './keys';

const approveTimesheet = async (employeeId: string, month: number, year: number) => {
  const res = await apiClient.patch(
    `${URL_API_GET_ATTENDANCES}/employee/${employeeId}/approve`,
    {},
    { params: { month, year } },
  );
  return res.data;
};

export const useApproveTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      month,
      year,
    }: {
      employeeId: string;
      month: number;
      year: number;
    }) => approveTimesheet(employeeId, month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKeys.all });
    },
  });
};
