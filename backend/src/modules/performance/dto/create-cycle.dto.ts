import {
  IsString,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewPeriodType } from '@prisma/client';

export class CreateCycleDto {
  @IsString() title: string;
  @IsEnum(ReviewPeriodType) period_type: ReviewPeriodType;
  @Type(() => Number) @IsInt() period_year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) period_seq: number;
  @IsDateString() announce_date: string;
}
