import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveType)
  leave_type?: LeaveType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

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

export class QueryLeaveRequestDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value))
      return value.flatMap((item) =>
        typeof item === 'string' ? item.split(',') : [],
      );
    if (typeof value === 'string')
      return value.split(',').filter((item) => item);
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  employee_id?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value))
      return value.flatMap((item) =>
        typeof item === 'string' ? item.split(',') : [],
      );
    if (typeof value === 'string')
      return value.split(',').filter((item) => item);
    return undefined;
  })
  @IsArray()
  @IsEnum(LeaveStatus, { each: true })
  status?: LeaveStatus[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value))
      return value.flatMap((item) =>
        typeof item === 'string' ? item.split(',') : [],
      );
    if (typeof value === 'string')
      return value.split(',').filter((item) => item);
    return undefined;
  })
  @IsArray()
  @IsEnum(LeaveType, { each: true })
  leave_type?: LeaveType[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value))
      return value.flatMap((item) =>
        typeof item === 'string' ? item.split(',') : [],
      );
    if (typeof value === 'string')
      return value.split(',').filter((item) => item);
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  department_id?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

export class BulkUpdateLeaveStatusDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  actorRoles?: string[];
}
