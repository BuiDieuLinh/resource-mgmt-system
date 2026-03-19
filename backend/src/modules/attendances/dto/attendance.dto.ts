import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @IsString()
  employee_id: string;

  @IsDateString()
  work_date: string;

  @IsOptional()
  @IsDateString()
  check_in_time?: string;

  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @IsOptional()
  @IsNumber()
  check_in_lat?: number;

  @IsOptional()
  @IsNumber()
  check_in_lng?: number;

  @IsOptional()
  @IsNumber()
  check_out_lat?: number;

  @IsOptional()
  @IsNumber()
  check_out_lng?: number;

  @IsOptional()
  @IsNumber()
  late?: number;

  @IsOptional()
  @IsNumber()
  early_leave?: number;

  @IsOptional()
  @IsNumber()
  overtime?: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsDateString()
  check_in_time?: string;

  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @IsOptional()
  @IsNumber()
  check_in_lat?: number;

  @IsOptional()
  @IsNumber()
  check_in_lng?: number;

  @IsOptional()
  @IsNumber()
  check_out_lat?: number;

  @IsOptional()
  @IsNumber()
  check_out_lng?: number;

  @IsOptional()
  @IsNumber()
  late?: number;

  @IsOptional()
  @IsNumber()
  early_leave?: number;

  @IsOptional()
  @IsNumber()
  overtime?: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
