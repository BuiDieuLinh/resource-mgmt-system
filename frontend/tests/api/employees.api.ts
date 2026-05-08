import { apiCall, type ApiResponse } from './client';
import { log } from '../common/logger';
import { IEmployeePayload } from '../models';

export interface Employee extends IEmployeePayload {
  id: string;
  created_at: string;
}

export interface EmployeeResponse {
  count: number;
  data: Employee[];
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export async function findEmployeeByName(name: string, token: string): Promise<EmployeeResponse> {
  const res = await apiCall<EmployeeResponse>(`employees?search=${encodeURIComponent(name)}`, {
    token,
  });
  return res.data as EmployeeResponse;
}

export async function ensureEmployee(payload: IEmployeePayload, token: string): Promise<Employee> {
  log.step(`Ensure employee exists: ${payload.full_name}`);

  const existing = await findEmployeeByName(payload.full_name, token);
  if (existing.count > 0) {
    log.info(`Employee already exists: ${payload.full_name} (${existing.data[0].id})`);
    return existing.data[0];
  }

  const res = await apiCall<Employee>('employees', {
    method: 'POST',
    body: payload,
    token,
  });
  log.ok(`Employee created: ${payload.full_name} (${(res.data as any).id})`);
  return res.data as Employee;
}

export async function deleteEmployee(id: string, token: string): Promise<void> {
  log.step(`Delete employee: ${id}`);
  await apiCall(`employees/${id}`, { method: 'DELETE', token });
  log.ok(`Employee deleted: ${id}`);
}

export async function getPositions(
  token: string,
): Promise<{ id: string; position_name: string }[]> {
  const res = await apiCall<any>('positions?pageSize=100', { token });
  return (res.data as any)?.data ?? [];
}
