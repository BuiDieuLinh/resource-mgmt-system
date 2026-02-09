import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class PositionDto {
  @IsString()
  @MaxLength(100)
  position_name: string;

  @IsString()
  @MaxLength(100)
  level: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  department_id: string;
}
