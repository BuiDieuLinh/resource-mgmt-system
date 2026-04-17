import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNotEmpty() @IsString() cycle_id: string;
  @IsNotEmpty() @IsString() employee_id: string;
  @IsNotEmpty() @IsString() reviewer_id: string; // employee.id của người login
  @Type(() => Number) @IsInt() @Min(1) @Max(100) score: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() achievements?: string;
}

export class SubmitReviewDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) score?: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() achievements?: string;
}
