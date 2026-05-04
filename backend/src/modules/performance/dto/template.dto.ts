import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType, ScoreType } from '@prisma/client';

export class CriteriaInlineDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  criterion: string;

  @IsInt()
  @Min(1)
  @Max(100)
  weight: number;

  @IsInt()
  @Min(1)
  max_score: number;

  @IsEnum(ScoreType)
  score_type: ScoreType;
}

export class CreateTemplateDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ContractType, { each: true })
  apply_to?: ContractType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriteriaInlineDto)
  criteria?: CriteriaInlineDto[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ContractType, { each: true })
  apply_to?: ContractType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriteriaInlineDto)
  criteria?: CriteriaInlineDto[];
}
