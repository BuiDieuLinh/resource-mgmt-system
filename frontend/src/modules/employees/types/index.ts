import type { EmployeeStatus } from '../../../constant';

export interface IEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  display_name?: string;

  email: string;
  phone: string;
  identify_card: string;

  gender: string;
  date_of_birth: string;
  address: string;
  avatar_url?: string;

  hire_date: string;
  status: EmployeeStatus;

  position: {
    id: string;
    position_name: string;
    level: string;
    description: string;
    department: {
      id: string;
      department_name: string;
      description: string;
    };
  };

  work_schedules?: IWorkSchedule;
  created_at: string;
}

export interface IWorkSchedule {
  id?: string;
  working_days: number;
  start_time: string;
  end_time: string;
}

export interface IEmployeePayload {
  employee_code: string;
  full_name: string;
  display_name?: string;
  email: string;
  phone: string;
  identify_card: string;
  gender: string;
  date_of_birth?: Date | string | null;
  address: string;
  hire_date: Date | string | null;
  position_id: string;
  status: string;
  avatar?: File | null;
  work_schedules?: IWorkSchedule;
}

export type EmployeeFormValues = IEmployeePayload;
