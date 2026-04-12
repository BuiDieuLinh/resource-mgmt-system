import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryEmployeeDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([EmployeeStatus.active, EmployeeStatus.inactive])
  filter?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;
}
