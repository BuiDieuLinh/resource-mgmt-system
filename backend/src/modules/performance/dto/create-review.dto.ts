import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreDetailDto {
  @IsNotEmpty() @IsString() criteria_id: string;
  @IsNotEmpty() @IsString() criteria_name: string;
  @IsNumber() @Min(0) @Max(100) weight: number;
  @IsNumber() @Min(1) max_score: number;
  @IsNumber() @Min(0) score: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateReviewDto {
  @IsNotEmpty() @IsString() cycle_id: string;
  @IsNotEmpty() @IsString() employee_id: string;
  @IsNotEmpty() @IsString() reviewer_id: string;
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) total_score: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() achievements?: string;
  @IsOptional() @IsString() result?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreDetailDto)
  score_details?: ScoreDetailDto[];
}

export class SubmitReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  total_score?: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() achievements?: string;
  @IsOptional() @IsString() result?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreDetailDto)
  score_details?: ScoreDetailDto[];
}
