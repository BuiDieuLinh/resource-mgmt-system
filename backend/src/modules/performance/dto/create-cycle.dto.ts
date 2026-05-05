import {
  IsString,
  IsEnum,
  IsInt,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewPeriodType } from '@prisma/client';

export class AssignmentDto {
  @IsUUID() employee_id: string;
  @IsOptional() @IsUUID() reviewer_id?: string;
}

export class CreateCycleDto {
  @IsString() title: string;
  @IsEnum(ReviewPeriodType) period_type: ReviewPeriodType;
  @Type(() => Number) @IsInt() period_year: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) period_seq: number;
  @IsDateString() announce_date: string;
  @IsOptional() @IsUUID() template_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  assignments?: AssignmentDto[];
}
