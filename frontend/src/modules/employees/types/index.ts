import type { EmployeeStatus } from "../../../constant";

export interface IEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  display_name?: string;

  email: string;
  phone?: string;
  identify_card: string;

  gender?: string;
  date_of_birth?: string; 
  avatar_url?: string;

  hire_date: string; 
  status: EmployeeStatus;

  department_id: string;
  position_id: string;

  created_at: string;
}

export interface IEmployeePayload {
  employee_code: string;
  full_name: string;
  display_name?: string;
  email: string;
  phone?: string;
  identify_card: string;
  gender?: string;
  date_of_birth?: Date | string | null;
  hire_date: Date | string | null;
  department_id: string;
  position_id: string;
  status: string;
  avatar?: File | null;
}

export type EmployeeFormValues = IEmployeePayload;
