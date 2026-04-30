import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';
import { HolidayModule } from 'src/modules/holidays/holiday.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, HolidayModule, NotificationsModule],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
