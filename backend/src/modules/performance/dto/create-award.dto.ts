import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AwardCategory } from '@prisma/client';

export class CreateAwardDto {
  @IsNotEmpty() @IsString() cycle_id: string;
  @IsNotEmpty() @IsString() employee_id: string;
  @IsEnum(AwardCategory) category: AwardCategory;
  @Type(() => Number) @IsInt() @Min(1) @Max(3) rank: number;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
}
