import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  holiday_date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;
}

export class UpdateHolidayDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  holiday_date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;
}

export class QueryHolidayDto {
  @IsOptional()
  @IsString()
  year?: string;
}
