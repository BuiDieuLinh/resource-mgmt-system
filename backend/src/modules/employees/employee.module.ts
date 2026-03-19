import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CommonModule } from 'src/common/common.module';
import { WorkScheduleModule } from 'src/modules/work-schedules/work-schedule.module';

@Module({
  imports: [CommonModule, WorkScheduleModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
