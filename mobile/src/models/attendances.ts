/**
 * Attendance Models
 */

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EARLY_DEPARTURE = 'early_departure',
  ON_LEAVE = 'on_leave',
  REMOTE = 'remote',
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus | string;
  working_hours?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInRequest {
  latitude?: number;
  longitude?: number;
  note?: string;
}

export interface CheckOutRequest {
  latitude?: number;
  longitude?: number;
  note?: string;
}

export interface CheckInResponse {
  id: string;
  check_in_time: string;
  message: string;
}

export interface CheckOutResponse {
  id: string;
  check_out_time: string;
  working_hours: number;
  message: string;
}

export interface GetAttendancesRequest {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetAttendancesResponse {
  data: Attendance[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AttendanceStats {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  early_departure: number;
  on_leave: number;
  remote: number;
  working_hours: number;
}
