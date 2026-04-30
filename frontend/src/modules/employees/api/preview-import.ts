import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';

export interface PreviewEmployee {
  employee_code: string;
  full_name: string;
  display_name: string;
  email: string;
  phone: string;
  identify_card: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  department_name: string;
  position_name: string;
}

interface PreviewResponse {
  success: boolean;
  data: PreviewEmployee[];
  message: string;
}

export const usePreviewImport = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<PreviewResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`${URL_API_GET_EMPLOYEES}/import/preview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
  });
};
