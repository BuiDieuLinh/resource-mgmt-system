/**
 * Department Models
 */

export interface Department {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  manager_id?: string;
  employee_count?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface GetDepartmentsRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetDepartmentsResponse {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
