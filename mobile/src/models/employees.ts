/**
 * Employee Models
 */

export interface Position {
  id: string;
  name: string;
  description?: string;
  level?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  employee_code: string;
  department: Department;
  position: Position;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
  manager_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFilter {
  search?: string;
  department_id?: string;
  position_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetEmployeesRequest {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
  position_id?: string;
  status?: string;
}

export interface GetEmployeesResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
