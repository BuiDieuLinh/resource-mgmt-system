import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class MailScheduler {
  private readonly logger = new Logger(MailScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    const tz = this.config.get<string>('APP_TIMEZONE');
    if (!tz)
      throw new Error('APP_TIMEZONE is not set in environment variables');
  }

  @Cron('0 8 * * *', { timeZone: process.env.APP_TIMEZONE })
  async sendHireDateWelcomeEmails() {
    const todayStr = dayjs.utc().format('YYYY-MM-DD');
    const startOfDay = dayjs.utc(todayStr).startOf('day').toDate();
    const endOfDay = dayjs.utc(todayStr).endOf('day').toDate();

    this.logger.log(`[Cron] Scanning employees with hire_date = ${todayStr}`);

    const employees = await this.prisma.employees.findMany({
      where: { hire_date: { gte: startOfDay, lte: endOfDay } },
      include: { position: { include: { department: true } } },
    });

    if (!employees.length) {
      this.logger.log('[Cron] No employees starting today.');
      return;
    }

    this.logger.log(
      `[Cron] Found ${employees.length} employee(s). Sending emails...`,
    );
    const loginUrl =
      this.config.get<string>('AUTH_LOGIN_URL') ??
      'http://localhost:5173/login';

    for (const emp of employees) {
      await this.mailService.sendWelcomeEmail({
        fullName: emp.full_name,
        email: emp.email,
        employeeCode: emp.employee_code,
        position: emp.position?.position_name ?? '',
        department: emp.position?.department?.department_name ?? '',
        loginUrl,
      });
    }

    this.logger.log(`[Cron] Done. Sent ${employees.length} welcome email(s).`);
  }
}
