export interface IReviewCycle {
  id: string;
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_year: number;
  period_seq: number;
  announce_date: string;
  created_by: string;
  created_at: string;
  _count?: { reviews: number; awards: number };
}

export interface IPerformanceReview {
  id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  score?: number; // hidden for employee
  comment?: string;
  achievements?: string;
  status: 'draft' | 'submitted' | 'published';
  attendance_days?: number;
  late_count?: number;
  absent_count?: number;
  overtime_minutes?: number;
  employee?: any;
  reviewer?: { id: string; full_name: string };
}

export interface IAward {
  id: string;
  cycle_id: string;
  employee_id: string;
  category: 'top_employee' | 'top_manager';
  rank: number;
  title: string;
  description?: string;
  created_at: string;
  cycle?: IReviewCycle;
  employee?: any;
  reveals?: { seen_at: string }[];
}
