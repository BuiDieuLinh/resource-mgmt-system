import { IsInt, Min, Max } from 'class-validator';

export class WorkScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  start_time: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  end_time: number;
}
