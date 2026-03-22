import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { PositionLevel } from '@prisma/client';

export class PositionDto {
  @IsString()
  @MaxLength(100)
  position_name: string;

  @IsString()
  @MaxLength(100)
  level: PositionLevel;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  department_id: string;
}
