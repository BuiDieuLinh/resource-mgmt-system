import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  IsNumber,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceDto {
  @IsString()
  employee_id: string;

  @IsDateString()
  work_date: string;

  @IsInt()
  @Min(0)
  scheduled_start: number;

  @IsInt()
  @Min(0)
  scheduled_end: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  break_start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  break_end?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  flexible_start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  flexible_end?: number;

  @IsOptional()
  @IsDateString()
  check_in_time?: string;

  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @IsNumber()
  @Min(0)
  late?: number;

  @IsNumber()
  @Min(0)
  early_leave?: number;

  @IsNumber()
  @Min(0)
  overtime: number;

  @IsNumber()
  @Min(0)
  work_minutes: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
