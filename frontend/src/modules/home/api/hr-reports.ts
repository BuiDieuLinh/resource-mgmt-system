import { apiClient } from '@/lib/api';

export interface HrStructureByDepartment {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  percentage: number;
}

export interface HrStructureByAge {
  ageGroup: string;
  employeeCount: number;
  percentage: number;
}

export interface HrStructureByGender {
  gender: string;
  employeeCount: number;
  percentage: number;
}

export interface HrStructureByTenure {
  tenureGroup: string;
  employeeCount: number;
  percentage: number;
}

export interface HrStructureByContract {
  contractType: string;
  employeeCount: number;
  percentage: number;
}

export interface HrStructureResponse {
  totalEmployees: number;
  byDepartment: HrStructureByDepartment[];
  byAge: HrStructureByAge[];
  byGender: HrStructureByGender[];
  byTenure: HrStructureByTenure[];
  byContract: HrStructureByContract[];
}

export interface TurnoverData {
  period: string;
  newHires: number;
  terminations: number;
  averageEmployees: number;
  turnoverRate: number;
  retentionRate: number;
}

export interface TurnoverResponse {
  period: string;
  data: TurnoverData[];
  summary: {
    totalNewHires: number;
    totalTerminations: number;
    averageTurnoverRate: number;
    averageRetentionRate: number;
    averageTenureMonths: number;
  };
}

export interface AlertInsight {
  type: string;
  title: string;
  description: string;
  correlation: number;
  affectedEmployees?: number;
  recommendation?: string;
}

export const getHrStructure = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data: HrStructureResponse }> => {
  const response = await apiClient.get('/reports/hr/structure', { params });
  return response.data;
};

export const getTurnoverReport = async (params?: {
  period?: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
  quarter?: number;
}): Promise<{ data: TurnoverResponse }> => {
  const response = await apiClient.get('/reports/hr/turnover', { params });
  return response.data;
};

export const getInsights = async (): Promise<{ data: AlertInsight[] }> => {
  const response = await apiClient.get('/reports/insights');
  return response.data;
};
