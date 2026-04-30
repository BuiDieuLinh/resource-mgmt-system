/**
 * Work Policy Models
 */

export enum WorkPolicyType {
  WORK_HOURS = 'work_hours',
  OVERTIME = 'overtime',
  SHIFT = 'shift',
  FLEXIBLE = 'flexible',
  REMOTE = 'remote',
}

export interface WorkPolicy {
  id: string;
  name: string;
  policy_type: WorkPolicyType | string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  break_duration?: number;
  max_working_hours: number;
  applicable_to?: 'all' | 'department' | 'employee';
  department_id?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface GetWorkPoliciesRequest {
  policy_type?: string;
  applicable_to?: string;
  department_id?: string;
  page?: number;
  limit?: number;
}

export interface GetWorkPoliciesResponse {
  data: WorkPolicy[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
