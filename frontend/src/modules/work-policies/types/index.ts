export interface IWorkPolicy {
  id: string;
  is_flexible_enabled: boolean;
  flexible_start: number | null;
  flexible_end: number | null;
  check_in_cutoff_minutes: number | null;
  break_start: number | null;
  break_end: number | null;
  office_latitude: number | null;
  office_longitude: number | null;
  max_distance_meters: number | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface IWorkPolicyPayload {
  is_flexible_enabled: boolean;
  flexible_start?: number | null;
  flexible_end?: number | null;
  check_in_cutoff_minutes?: number | null;
  break_start?: number | null;
  break_end?: number | null;
  office_latitude?: number | null;
  office_longitude?: number | null;
  max_distance_meters?: number | null;
  effective_from: string;
  effective_to?: string | null;
}

export interface IWorkPolicyUpdatePayload {
  effective_to?: string | null;
}
