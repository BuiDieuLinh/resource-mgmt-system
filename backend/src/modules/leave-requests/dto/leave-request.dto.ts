import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { LeaveStatus, LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsString()
  employee_id: string;

  @IsEnum(LeaveType)
  leave_type: LeaveType;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  leave_start_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  leave_end_minutes?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus;
}

export class QueryLeaveRequestDto {
  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;
}
