import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CommonModule } from 'src/common/common.module';
import { WorkScheduleModule } from 'src/modules/work-schedules/work-schedule.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [CommonModule, WorkScheduleModule, AuthModule, MailModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
