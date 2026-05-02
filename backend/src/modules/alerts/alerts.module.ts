import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './services/alerts.service';
import { AlertSchedulerService } from './services/alert-scheduler.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertSchedulerService],
  exports: [AlertsService],
})
export class AlertsModule {}
