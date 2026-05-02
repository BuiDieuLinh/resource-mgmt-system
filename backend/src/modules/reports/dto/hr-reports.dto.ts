import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class HrStructureQueryDto {
  @ApiPropertyOptional({ description: 'Ngày bắt đầu' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TurnoverQueryDto {
  @ApiPropertyOptional({ enum: ReportPeriod, default: ReportPeriod.MONTH })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ description: 'Năm' })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Tháng (1-12)' })
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ description: 'Quý (1-4)' })
  @IsOptional()
  quarter?: number;
}

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
