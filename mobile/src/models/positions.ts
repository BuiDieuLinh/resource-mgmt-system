/**
 * Position Models
 */

export interface Position {
  id: string;
  name: string;
  description?: string;
  level?: string;
  salary_range?: {
    min: number;
    max: number;
  };
  department_id?: string;
  employee_count?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface GetPositionsRequest {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
}

export interface GetPositionsResponse {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
