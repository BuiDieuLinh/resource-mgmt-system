import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkScheduleDto } from 'src/modules/work-schedules/dto/work-schedule.dto';
import { EmployeeStatus } from '@prisma/client';

export class EmployeeDto {
  @IsUUID()
  id: string;

  @IsString()
  employee_code: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  identify_card: string;

  @IsString()
  gender: string;

  @IsDateString()
  date_of_birth: Date;

  @IsString()
  address: string;

  @IsUUID()
  position_id: string;

  @IsDateString()
  hire_date: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDto)
  work_schedules?: WorkScheduleDto[];
}
