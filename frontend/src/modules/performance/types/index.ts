import type {
  ScoreType,
  ReviewStatus,
  ReviewPeriodType,
  AwardCategory,
  ContractType,
} from '@/constant';

export type { ScoreType, ReviewStatus, ReviewPeriodType, AwardCategory, ContractType };

export interface IEvaluationCriteria {
  id: string;
  template_id: string;
  criterion: string;
  weight: number;
  max_score: number;
  score_type: ScoreType;
}

export interface IEvaluationTemplate {
  id: string;
  title: string;
  description?: string;
  apply_to?: ContractType[];
  is_active: boolean;
  created_at: string;
  criteria?: IEvaluationCriteria[];
  _count?: { criteria: number; cycles: number };
}

export interface IReviewCycle {
  id: string;
  title: string;
  period_type: ReviewPeriodType;
  period_year: number;
  period_seq: number;
  announce_date: string;
  template_id?: string;
  template?: IEvaluationTemplate;
  created_by: string;
  created_at: string;
  _count?: { reviews: number; awards: number; assignments: number };
  reviews?: Array<{
    id: string;
    status: ReviewStatus;
    total_score?: number;
    comment?: string;
    achievements?: string;
    score_details?: Array<{ id: string }>;
  }>;
  assignments?: Array<{
    id: string;
    employee_id: string;
    reviewer_id: string;
    employee?: any;
    reviewer?: { id: string; full_name: string; email?: string };
  }>;
}

export interface IScoreDetail {
  id: string;
  review_id: string;
  criteria_id: string;
  criteria_name: string;
  weight: number;
  max_score: number;
  score: number;
  note?: string;
}

export interface IPerformanceReview {
  id: string;
  cycle_id: string;
  employee_id: string;
  assignment_id?: string;
  total_score?: number;
  comment?: string;
  achievements?: string;
  status: ReviewStatus;
  attendance_days?: number;
  late_count?: number;
  absent_count?: number;
  overtime_minutes?: number;
  result?: string;
  created_at: string;
  updated_at: string;
  employee?: any;
  cycle?: IReviewCycle;
  score_details?: IScoreDetail[];
  assignment?: {
    reviewer_id: string;
    reviewer?: { id: string; full_name: string };
  };
}

export interface IAward {
  id: string;
  cycle_id: string;
  employee_id: string;
  category: AwardCategory;
  rank: number;
  title: string;
  description?: string;
  is_seen: boolean;
  created_at: string;
  cycle?: IReviewCycle;
  employee?: any;
}

// Form value types
export interface CriteriaFormValues {
  id?: string;
  criterion: string;
  weight: number;
  max_score: number;
  score_type: ScoreType;
}

export interface TemplateFormValues {
  title: string;
  description?: string;
  apply_to: ContractType[];
  criteria: CriteriaFormValues[];
}

export interface CycleFormValues {
  title: string;
  period_type: ReviewPeriodType;
  period_year: number;
  period_seq: number;
  announce_date: Date | null;
  template_id?: string;
}
