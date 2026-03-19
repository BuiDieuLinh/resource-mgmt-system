import { IsInt, IsString, Min, Max, Matches } from 'class-validator';

export class WorkScheduleDto {
  @IsInt()
  @Min(1)
  @Max(7)
  working_days: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:mm' })
  start_time: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:mm' })
  end_time: string;
}
