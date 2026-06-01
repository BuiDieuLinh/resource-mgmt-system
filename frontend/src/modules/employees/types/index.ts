import type { IAward } from '@/modules/performance/types';
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
  face_descriptor?: number[];

  contract_type?: string;
  hire_date: string;
  terminated_at?: string | null;
  status: EmployeeStatus;
  annual_leave_days: number;

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

  manager_id?: string | null;
  manager?: {
    id: string;
    full_name: string;
    employee_code: string;
    email: string;
    position: {
      position_name: string;
    };
  } | null;

  work_schedules?: IWorkSchedule[];
  employment_histories?: IEmploymentHistory[];
  created_at: string;
  awards?: IAward[];
}

export interface IEmploymentHistory {
  id: string;
  event_type:
    | 'hired'
    | 'contract_changed'
    | 'promoted'
    | 'transferred'
    | 'resigned'
    | 'terminated'
    | 'rehired';
  from_position_id?: string | null;
  to_position_id?: string | null;
  department_id?: string | null;
  contract_type?: string | null;
  start_date: string;
  end_date?: string | null;
  comment?: string | null;
  created_at: string;
  from_pos?: {
    position_name: string;
  } | null;
  to_pos?: {
    position_name: string;
  } | null;
}

export interface IWorkSchedule {
  id?: string;
  day_of_week: number;
  start_time: number;
  end_time: number;
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
  contract_type?: string;
  manager_id?: string | null;
  terminated_at?: Date | string | null;
  avatar?: File | null;
  work_schedules?: IWorkSchedule[];
}

export type EmployeeFormValues = IEmployeePayload;
