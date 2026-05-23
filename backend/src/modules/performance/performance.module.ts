import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { TemplateService } from './services/template.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MailModule],
  controllers: [PerformanceController],
  providers: [PerformanceService, TemplateService],
  exports: [PerformanceService, TemplateService],
})
export class PerformanceModule {}
