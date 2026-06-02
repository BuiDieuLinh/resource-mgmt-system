import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Every day at 7:00 AM — generate new reminder logs for all triggers
   */
  @Cron('0 7 * * *', { timeZone: process.env.APP_TIMEZONE })
  async generateDailyReminders() {
    this.logger.log('[Reminder] Generating daily reminder logs...');
    try {
      await this.remindersService.generateReminderLogs();
      this.logger.log('[Reminder] Daily reminder logs generated');
    } catch (err) {
      this.logger.error(`[Reminder] Failed to generate logs: ${err.message}`);
    }
  }

  /**
   * Every 30 minutes — process pending logs and dispatch notifications
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    timeZone: process.env.APP_TIMEZONE,
  })
  async processPendingReminders() {
    this.logger.log('[Reminder] Processing pending reminder logs...');
    try {
      await this.remindersService.processPendingLogs();
    } catch (err) {
      this.logger.error(`[Reminder] Failed to process logs: ${err.message}`);
    }
  }
}
