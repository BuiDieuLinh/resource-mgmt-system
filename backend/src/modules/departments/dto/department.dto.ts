import { IsString, IsOptional, MaxLength } from 'class-validator';

export class DepartmentDto {
  @IsString()
  @MaxLength(100)
  department_code: string;

  @IsString()
  @MaxLength(100)
  department_name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
