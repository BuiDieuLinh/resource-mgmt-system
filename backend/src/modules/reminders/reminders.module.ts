import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RemindersService } from './reminders.service';
import { RemindersScheduler } from './reminders.scheduler';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersScheduler],
  exports: [RemindersService],
})
export class RemindersModule {}
