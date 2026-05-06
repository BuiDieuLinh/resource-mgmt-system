import { ReminderChannel, ReminderTriggerType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class NotificationSettings {
  @IsEnum(ReminderTriggerType) trigger_type: ReminderTriggerType;
  @IsEnum(ReminderChannel) channel: ReminderChannel;
  @IsOptional() @IsBoolean() is_enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) days_before?:
    | number
    | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) repeat_interval_days?:
    | number
    | null;
}
