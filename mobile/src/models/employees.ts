import type { Department } from './departments';

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  face_descriptor?: number[];
  work_schedules?: Array<{
    id: string;
    day_of_week: number;
    start_time: number;
    end_time: number;
    employee_id: string;
  }>;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  employee_code: string;
  department: Department;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
  manager_id?: string;
  created_at?: string;
  updated_at?: string;
  annual_leave_days?: number;
  contract_type: 'full_time' | 'part_time' | 'contractor' | 'intern';
  position: {
    id: string;
    position_name: string;
    level: number;
    department: {
      id: string;
      department_name: string;
    };
  };
  manager?: {
    id: string;
    full_name: string;
  } | null;
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
