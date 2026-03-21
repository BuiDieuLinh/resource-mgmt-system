export interface IWorkPolicy {
  id: string;
  is_flexible_enabled: boolean;
  flexible_start: number | null;
  flexible_end: number | null;
  break_start: number | null;
  break_end: number | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface IWorkPolicyPayload {
  is_flexible_enabled: boolean;
  flexible_start?: number | null;
  flexible_end?: number | null;
  break_start?: number | null;
  break_end?: number | null;
  effective_from: string;
  effective_to?: string | null;
}
