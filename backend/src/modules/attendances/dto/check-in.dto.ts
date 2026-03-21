import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsString()
  employee_id: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
