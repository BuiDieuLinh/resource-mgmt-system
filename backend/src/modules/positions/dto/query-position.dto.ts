import { IsOptional, IsInt, Min, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPositionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageIndex?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;
}
