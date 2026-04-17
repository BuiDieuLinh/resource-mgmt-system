import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employees/employee.module';
import { DepartmentModule } from './modules/departments/department.module';
import { PositionModule } from './modules/positions/position.module';
import { WorkScheduleModule } from './modules/work-schedules/work-schedule.module';
import { WorkPolicyModule } from './modules/work-policies/work-policy.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { LeaveRequestModule } from './modules/leave-requests/leave-request.module';
import { HolidayModule } from './modules/holidays/holiday.module';
import { PerformanceModule } from './modules/performance/performance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeeModule,
    DepartmentModule,
    PositionModule,
    WorkScheduleModule,
    WorkPolicyModule,
    AttendancesModule,
    LeaveRequestModule,
    HolidayModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
