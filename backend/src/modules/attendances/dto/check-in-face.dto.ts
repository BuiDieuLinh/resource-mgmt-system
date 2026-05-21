import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CheckInFaceDto {
  @IsNotEmpty()
  @IsString()
  employee_id: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map(Number);
    }
  })
  @IsArray()
  face_descriptor: number[]; // Float32Array converted to number[]
}
