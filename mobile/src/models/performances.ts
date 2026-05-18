export interface ReviewCycle {
  id: string;
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_year: number;
  period_seq: number;
  announce_date: string;
  template_id?: string;
  created_by: string;
  created_at: string;
  template?: {
    id: string;
    title: string;
  };
}

export interface PerformanceReview {
  id: string;
  cycle_id: string;
  employee_id: string;
  assignment_id?: string;
  total_score?: number;
  comment?: string;
  achievements?: string;
  status: 'draft' | 'submitted' | 'published';
  attendance_days?: number;
  late_count?: number;
  absent_count?: number;
  overtime_minutes?: number;
  created_at: string;
  updated_at: string;
  score_details?: ScoreDetail[];
  cycle?: ReviewCycle;
}

export interface ScoreDetail {
  id: string;
  review_id: string;
  criteria_id: string;
  criteria_name: string;
  weight: number;
  max_score: number;
  score: number;
  note?: string;
}

export interface Award {
  id: string;
  cycle_id: string;
  employee_id: string;
  category: 'top_employee' | 'top_manager';
  rank: number;
  title: string;
  description?: string;
  is_seen: boolean;
  created_at: string;
  cycle: ReviewCycle;
}
