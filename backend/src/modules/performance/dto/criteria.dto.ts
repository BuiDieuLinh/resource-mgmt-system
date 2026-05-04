import { IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ScoreType } from '@prisma/client';

export class CreateCriteriaDto {
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

export class UpdateCriteriaDto {
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
