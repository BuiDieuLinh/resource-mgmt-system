import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkScheduleDto } from 'src/modules/work-schedules/dto/work-schedule.dto';
import { EmployeeStatus, ContractType } from '@prisma/client';

export class CreateEmployeeDto {
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
  @IsEnum(ContractType)
  contract_type?: ContractType;

  @IsOptional()
  @ValidateIf((o) => o.manager_id !== null)
  @IsUUID()
  manager_id?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.terminated_at !== null)
  @IsDateString()
  terminated_at?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDto)
  work_schedules?: WorkScheduleDto[];
}
