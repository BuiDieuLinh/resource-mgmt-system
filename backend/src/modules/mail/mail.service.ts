import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { welcomeTemplate } from './templates/welcome.template';
import { reminderTemplate } from './templates/reminder.template';

export interface WelcomeMailPayload {
  fullName: string;
  email: string;
  employeeCode: string;
  position: string;
  department: string;
  loginUrl: string;
}

export interface ReminderMailPayload {
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendWelcomeEmail(payload: WelcomeMailPayload) {
    const defaultPassword = this.config.get<string>(
      'DEFAULT_PASSWORD',
      '888888',
    );

    this.logger.log(
      `Sending welcome email to ${payload.email} (${payload.fullName})`,
    );

    try {
      await this.mailer.sendMail({
        to: payload.email,
        subject: '🎉 Chào mừng bạn đến với RMS Platform',
        html: welcomeTemplate({ ...payload, defaultPassword }),
      });
      this.logger.log(`✅ Welcome email sent successfully to ${payload.email}`);
    } catch (err) {
      this.logger.error(
        `❌ Failed to send welcome email to ${payload.email}: ${err.message}`,
      );
    }
  }

  async sendReminderEmail(payload: ReminderMailPayload) {
    this.logger.log(`Sending reminder email to ${payload.to}`);
    try {
      await this.mailer.sendMail({
        to: 'buithidieulinh.1004@gmail.com', // payload.to
        subject: payload.subject,
        html: reminderTemplate({
          recipientName: payload.recipientName,
          body: payload.body,
          ctaUrl: payload.ctaUrl,
          ctaLabel: payload.ctaLabel,
        }),
      });
      this.logger.log(`✅ Reminder email sent to ${payload.to}`);
    } catch (err) {
      this.logger.error(
        `❌ Failed to send reminder email to ${payload.to}: ${err.message}`,
      );
    }
  }
}
