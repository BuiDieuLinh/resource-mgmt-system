import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AlertType {
  LATE_SPIKE = 'late_spike',
  SHIFT_UNDERSTAFFED = 'shift_understaffed',
  HIGH_TURNOVER = 'high_turnover',
  CONSECUTIVE_ABSENT = 'consecutive_absent',
  EXCESSIVE_OT = 'excessive_ot',
  FAIRNESS_IMBALANCE = 'fairness_imbalance',
  KPI_DROP = 'kpi_drop',
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
  targetUsers: string[];
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
  correlation: number;
  affectedEmployees?: number;
  recommendation?: string;
}
