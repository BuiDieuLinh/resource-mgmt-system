import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AlertType {
  LATE_SPIKE = 'late_spike', // AL-01: Tỷ lệ đi trễ tăng đột biến
  SHIFT_UNDERSTAFFED = 'shift_understaffed', // AL-02: Ca thiếu người
  HIGH_TURNOVER = 'high_turnover', // AL-03: Turnover rate cao
  CONSECUTIVE_ABSENT = 'consecutive_absent', // AL-04: Nhân viên vắng liên tiếp
  EXCESSIVE_OT = 'excessive_ot', // AL-05: OT bất thường
  FAIRNESS_IMBALANCE = 'fairness_imbalance', // AL-06: Fairness mất cân bằng
  KPI_DROP = 'kpi_drop', // AL-07: KPI giảm mạnh
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export class AlertQueryDto {
  @ApiPropertyOptional({ enum: AlertType })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;
}

export interface AlertData {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  metadata: Record<string, any>;
  targetUsers: string[]; // User IDs
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AlertInsight {
  type: string;
  title: string;
  description: string;
  correlation: number; // 0-1
  affectedEmployees?: number;
  recommendation?: string;
}
