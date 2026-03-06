import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import type { PreviewEmployee } from './preview-import';

interface ImportResponse {
  success: boolean;
  data: {
    imported: number;
    failed: number;
    details: {
      imported: string[];
      failed: Array<{ employee_code: string; reason: string }>;
    };
  };
  message: string;
}

export const useImportEmployees = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employees: PreviewEmployee[]): Promise<ImportResponse> => {
      const response = await apiClient.post('/employees/import', {
        employees,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
