export type EmployeeStatus = 'active' | 'inactive';

export type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export type ReviewStatus = 'draft' | 'submitted' | 'published';

export type AwardCategory = 'top_employee' | 'top_manager';

export type PeriodType = 'monthly' | 'quarterly';

export type LevelPosition = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';

export type Role = 'admin' | 'manager' | 'employee';

export interface IAuthUser {
  id: string;
  email: string;
  roles: string[];
  is_first_login: boolean;
  status: EmployeeStatus;
}

export interface ILoginResponse {
  access_token: string;
  user: IAuthUser;
  is_first_login: boolean;
}

export interface IDepartment {
  id: string;
  department_code: string;
  department_name: string;
  description?: string;
}

export interface IDepartmentPayload {
  department_code: string;
  department_name: string;
  description?: string;
}

export interface IPosition {
  id: string;
  position_name: string;
  level: LevelPosition;
  description?: string;
  department_id: string;
  department?: IDepartment;
}

export interface IPositionPayload {
  position_name: string;
  level: LevelPosition;
  description?: string;
  department_id: string;
}

export interface IWorkSchedule {
  id?: string;
  employee_id?: string;
  day_of_week: number;
  start_time: number;
  end_time: number;
}

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
  auth_user_id?: string;
  position: IPosition & { department: IDepartment };
  work_schedules?: IWorkSchedule[];
  created_at: string;
}

export interface IEmployeePayload {
  full_name: string;
  employee_code: string;
  display_name?: string;
  email: string;
  phone: string;
  identify_card: string;
  gender: string;
  date_of_birth: string;
  address: string;
  hire_date: string;
  position_id: string;
  manager_id: string;
  status: EmployeeStatus;
  work_schedules?: IWorkSchedule[];
}

export interface IAttendance {
  id: string;
  employee_id: string;
  work_date: string;
  scheduled_start?: number;
  scheduled_end?: number;
  break_start?: number | null;
  break_end?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  check_out_lat?: number | null;
  check_out_lng?: number | null;
  late?: number;
  early_leave?: number;
  overtime?: number;
  work_minutes?: number;
  status: AttendanceStatus;
  employee?: Pick<IEmployee, 'id' | 'full_name' | 'employee_code'>;
}

export interface IAttendanceSummary {
  employee_id: string;
  full_name: string;
  plan_day: number;
  actual_day: number;
  late: number;
  absent: number;
  over_time: number;
}

export interface ICheckInPayload {
  employee_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface ICheckOutPayload extends ICheckInPayload {}

export interface IWorkPolicy {
  id: string;
  is_flexible_enabled: boolean;
  flexible_start?: number | null;
  flexible_end?: number | null;
  break_start?: number | null;
  break_end?: number | null;
  effective_from: string;
  effective_to?: string | null;
}

export interface IWorkPolicyPayload {
  is_flexible_enabled: boolean;
  flexible_start?: number;
  flexible_end?: number;
  break_start?: number;
  break_end?: number;
  effective_from: string;
  effective_to?: string;
}

export interface IHoliday {
  id: string;
  name: string;
  holiday_date: string;
  description?: string | null;
  is_paid: boolean;
}

export interface IHolidayPayload {
  name: string;
  holiday_date: string;
  description?: string;
  is_paid: boolean;
}

export interface ILeaveRequest {
  id: string;
  employee_id: string;
  employee?: Pick<IEmployee, 'id' | 'full_name' | 'employee_code'>;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  leave_start_minutes?: number | null;
  leave_end_minutes?: number | null;
  reason?: string | null;
  status: LeaveStatus;
  approved_by_manager?: string | null;
  manager_approved_at?: string | null;
  approved_by_admin?: string | null;
  admin_approved_at?: string | null;
  created_at: string;
}

export interface ILeaveRequestPayload {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  leave_start_minutes?: number;
  leave_end_minutes?: number;
  reason?: string;
}

export interface IUpdateLeaveStatusPayload {
  status: 'approved' | 'rejected';
}

export interface IReviewCycle {
  id: string;
  title: string;
  period_type: PeriodType;
  period_year: number;
  period_seq: number;
  announce_date: string;
  created_by: string;
  created_at: string;
  _count?: { reviews: number; awards: number };
}

export interface IReviewCyclePayload {
  title: string;
  period_type: PeriodType;
  period_year: number;
  period_seq: number;
  announce_date: string;
}

export interface IPerformanceReview {
  id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  score?: number;
  comment?: string;
  achievements?: string;
  status: ReviewStatus;
  attendance_days?: number;
  late_count?: number;
  absent_count?: number;
  overtime_minutes?: number;
  employee?: Partial<IEmployee>;
  reviewer?: Pick<IEmployee, 'id' | 'full_name'>;
}

export interface ICreateReviewPayload {
  cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  score: number;
  comment?: string;
  achievements?: string;
}

export interface ISubmitReviewPayload {
  score: number;
  comment?: string;
  achievements?: string;
}

export interface IAward {
  id: string;
  cycle_id: string;
  employee_id: string;
  category: AwardCategory;
  rank: number;
  title: string;
  description?: string;
  created_at: string;
  cycle?: IReviewCycle;
  employee?: Partial<IEmployee>;
  reveals?: { seen_at: string }[];
}

export interface IAwardPayload {
  cycle_id: string;
  employee_id: string;
  category: AwardCategory;
  rank: 1 | 2 | 3;
  title: string;
  description?: string;
}

export interface IApiResponse<T> {
  data: T;
  error: boolean;
  message: string;
  timestamp: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  count: number;
}
