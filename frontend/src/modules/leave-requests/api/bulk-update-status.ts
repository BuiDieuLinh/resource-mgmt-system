import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { URL_API_LEAVE_REQUESTS } from '@/constant/config';
import { leaveRequestKeys } from './keys';

const bulkUpdateLeaveStatus = async (payload: {
  ids: string[];
  status: 'approved' | 'rejected';
  comment?: string;
}) => {
  const res = await apiClient.patch(`${URL_API_LEAVE_REQUESTS}/bulk-status`, payload);
  return res.data;
};

export const useBulkUpdateLeaveStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateLeaveStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveRequestKeys.all }),
  });
};
