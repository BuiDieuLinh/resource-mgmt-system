import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateWorkPolicyDto {
  @IsBoolean()
  is_flexible_enabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  flexible_start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  flexible_end?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  check_in_cutoff_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  break_start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  break_end?: number;

  @IsOptional()
  @IsNumber()
  office_latitude?: number;

  @IsOptional()
  @IsNumber()
  office_longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  max_distance_meters?: number;

  @IsDateString()
  effective_from: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class UpdateWorkPolicyDto {
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
