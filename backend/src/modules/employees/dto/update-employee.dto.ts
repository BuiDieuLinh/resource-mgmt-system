import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkScheduleDto } from 'src/modules/work-schedules/dto/work-schedule.dto';
import { EmployeeStatus } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  employee_code?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  identify_card?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  position_id?: string;

  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  annual_leave_days?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDto)
  work_schedules?: WorkScheduleDto[];
}
