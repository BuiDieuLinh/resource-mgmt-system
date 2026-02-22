import { URL_API_GET_EMPLOYEES } from '@/constant/config';
import { apiClient } from '../../../lib/api';

export const exportEmployees = async (): Promise<Blob> => {
  const response = await apiClient.get(`${URL_API_GET_EMPLOYEES}/export`, {
    responseType: 'blob',
  });
  return response.data;
};
