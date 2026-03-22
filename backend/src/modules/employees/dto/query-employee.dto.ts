import { IsOptional, IsString, IsIn } from 'class-validator';
import { EmployeeStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryEmployeeDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([EmployeeStatus.active, EmployeeStatus.inactive])
  filter?: string;
}
