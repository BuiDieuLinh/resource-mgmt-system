import { apiClient } from '@/lib/api';
import { URL_API_GET_EMPLOYEES } from '@/constant/config';

export type CheckExistsField = 'employee_code' | 'email' | 'identify_card';

export const checkEmployeeExists = async (
  field: CheckExistsField,
  value: string,
  excludeId?: string,
): Promise<boolean> => {
  if (!value?.trim()) return false;
  const res = await apiClient.get(`${URL_API_GET_EMPLOYEES}/check-exists`, {
    params: { field, value, ...(excludeId ? { excludeId } : {}) },
  });
  return res.data?.data?.exists ?? false;
};
