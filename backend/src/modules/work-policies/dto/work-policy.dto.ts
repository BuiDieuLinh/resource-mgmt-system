import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsDateString,
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
  @Max(1439)
  break_start?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  break_end?: number;

  @IsDateString()
  effective_from: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
