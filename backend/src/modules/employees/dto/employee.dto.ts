import {
  IsUUID,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
} from 'class-validator'
import { EmployeeStatus } from '@prisma/client'

export class EmployeeDto {
  @IsUUID()
  id: string

  @IsString()
  employee_code: string

  @IsString()
  full_name: string

  @IsOptional()
  @IsString()
  display_name?: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsString()
  identify_card: string

  @IsOptional()
  @IsString()
  gender?: string

  @IsOptional()
  @IsDateString()
  date_of_birth?: string

  @IsUUID()
  department_id: string

  @IsUUID()
  position_id: string

  @IsDateString()
  hire_date: string

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus
}
