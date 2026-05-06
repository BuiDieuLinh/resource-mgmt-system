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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { RemindersModule } from './modules/reminders/reminders.module';

import { MailModule } from './modules/mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MailModule,
    EmployeeModule,
    DepartmentModule,
    PositionModule,
    WorkScheduleModule,
    WorkPolicyModule,
    AttendancesModule,
    LeaveRequestModule,
    HolidayModule,
    PerformanceModule,
    AnalyticsModule,
    NotificationsModule,
    ReportsModule,
    AlertsModule,
    RemindersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
