import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { ReminderChannel, ReminderTriggerType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getSettings() {
    const settings = await this.prisma.notificationSettings.findMany({
      orderBy: [{ trigger_type: 'asc' }, { channel: 'asc' }],
    });
    return ResponseHelper.success(settings);
  }

  async updateSetting(
    triggerType: ReminderTriggerType,
    channel: ReminderChannel,
    data: {
      is_enabled?: boolean;
      days_before?: number | null;
      repeat_interval_days?: number | null;
    },
    updatedBy: string,
  ) {
    const hasConfigChange =
      data.days_before !== undefined || data.repeat_interval_days !== undefined;
    const channelsToSync: ReminderChannel[] = hasConfigChange
      ? ['inapp', 'email']
      : [channel];

    const results = await Promise.all(
      channelsToSync.map((ch) =>
        this.prisma.notificationSettings.upsert({
          where: {
            trigger_type_channel: { trigger_type: triggerType, channel: ch },
          },
          create: {
            trigger_type: triggerType,
            channel: ch,
            is_enabled: ch === channel ? (data.is_enabled ?? true) : true,
            days_before: data.days_before ?? null,
            repeat_interval_days: data.repeat_interval_days ?? null,
            updated_by: updatedBy,
          },
          update: {
            ...(ch === channel && data.is_enabled !== undefined
              ? { is_enabled: data.is_enabled }
              : {}),
            ...(data.days_before !== undefined
              ? { days_before: data.days_before }
              : {}),
            ...(data.repeat_interval_days !== undefined
              ? { repeat_interval_days: data.repeat_interval_days }
              : {}),
            updated_by: updatedBy,
          },
        }),
      ),
    );

    return ResponseHelper.success(results[0], 'Setting updated');
  }

  async getDashboardReminders(employeeId: string, isAdmin: boolean) {
    const now = dayjs.utc().toDate();

    const settings = await this.prisma.notificationSettings.findMany({
      where: { channel: 'dashboard', is_enabled: true },
    });

    const contractEndingSetting = settings.find(
      (s) => s.trigger_type === 'contract_ending',
    );
    const cycleDeadlineSetting = settings.find(
      (s) => s.trigger_type === 'cycle_deadline',
    );
    const daysBefore = contractEndingSetting?.days_before ?? 7;
    const cycleDeadlineDays = cycleDeadlineSetting?.days_before ?? 7;

    const managerScope = isAdmin ? undefined : { manager_id: employeeId };

    const results: Array<{
      type: string;
      employee_id: string;
      employee_name: string;
      contract_type: string;
      days_remaining: number | null;
      cycle_id?: string;
      cycle_title?: string;
    }> = [];

    const contractEndingThreshold = dayjs.utc().add(daysBefore, 'day').toDate();
    const contractEndingEmployees = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        contract_type: { in: ['intern', 'probation'] },
        terminated_at: { gte: now, lte: contractEndingThreshold },
        ...managerScope,
      },
      include: { position: { include: { department: true } } },
    });

    for (const emp of contractEndingEmployees) {
      const hasReview = await this.prisma.performanceReviews.findFirst({
        where: {
          employee_id: emp.id,
          status: { in: ['submitted', 'published'] },
        },
      });
      if (!hasReview) {
        const daysLeft = dayjs(emp.terminated_at).diff(dayjs.utc(), 'day');
        results.push({
          type: 'contract_ending',
          employee_id: emp.id,
          employee_name: emp.full_name,
          contract_type: emp.contract_type,
          days_remaining: daysLeft,
        });
      }
    }

    const cycleDeadlineThreshold = dayjs
      .utc()
      .add(cycleDeadlineDays, 'day')
      .toDate();
    const upcomingCycles = await this.prisma.reviewCycles.findMany({
      where: {
        announce_date: { gte: now, lte: cycleDeadlineThreshold },
      },
    });

    for (const cycle of upcomingCycles) {
      const daysLeft = dayjs(cycle.announce_date).diff(dayjs.utc(), 'day');
      results.push({
        type: 'cycle_deadline',
        employee_id: '',
        employee_name: '',
        contract_type: '',
        days_remaining: daysLeft,
        cycle_id: cycle.id,
        cycle_title: cycle.title,
      });
    }

    const activeCycles = await this.prisma.reviewCycles.findMany({
      where: { announce_date: { gte: now } },
      include: {
        assignments: {
          include: {
            employee: {
              include: { position: { include: { department: true } } },
            },
          },
        },
        reviews: true,
      },
    });

    for (const cycle of activeCycles) {
      for (const assignment of cycle.assignments) {
        const emp = assignment.employee;
        if (managerScope && emp.manager_id !== employeeId) continue;

        const hasReview = cycle.reviews.find((r) => r.employee_id === emp.id);
        if (!hasReview) {
          results.push({
            type: 'cycle_unreviewed',
            employee_id: emp.id,
            employee_name: emp.full_name,
            contract_type: emp.contract_type,
            days_remaining: null,
            cycle_id: cycle.id,
            cycle_title: cycle.title,
          });
        }
      }
    }

    return ResponseHelper.success(results);
  }

  async processPendingLogs() {
    const now = dayjs.utc().toDate();
    const pending = await this.prisma.notificationLogs.findMany({
      where: { status: 'pending', scheduled_at: { lte: now } },
      include: {
        employee: true,
        cycle: true,
      },
      take: 100,
    });

    this.logger.log(`Processing ${pending.length} pending reminder logs`);

    for (const log of pending) {
      try {
        await this.dispatchLog(log);
        await this.prisma.notificationLogs.update({
          where: { id: log.id },
          data: { status: 'sent', sent_at: now },
        });
      } catch (err) {
        this.logger.error(`Failed to dispatch log ${log.id}: ${err.message}`);
        await this.prisma.notificationLogs.update({
          where: { id: log.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  async generateReminderLogs() {
    const now = dayjs.utc();

    const allSettings = await this.prisma.notificationSettings.findMany({
      where: { is_enabled: true, channel: { in: ['inapp', 'email'] } },
    });

    const recipients = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        position: { level: { in: ['manager', 'lead'] } },
      },
      select: { id: true, manager_id: true },
    });

    const triggerConfigs = new Map<
      ReminderTriggerType,
      {
        days_before: number;
        repeat_interval_days: number;
        channels: ReminderChannel[];
      }
    >();

    for (const s of allSettings) {
      if (!triggerConfigs.has(s.trigger_type)) {
        triggerConfigs.set(s.trigger_type, {
          days_before: s.days_before ?? 7,
          repeat_interval_days: s.repeat_interval_days ?? 2,
          channels: [],
        });
      }
      if (s.channel === 'inapp') {
        const cfg = triggerConfigs.get(s.trigger_type)!;
        cfg.days_before = s.days_before ?? cfg.days_before;
        cfg.repeat_interval_days =
          s.repeat_interval_days ?? cfg.repeat_interval_days;
      }
      triggerConfigs.get(s.trigger_type)!.channels.push(s.channel);
    }

    for (const [trigger_type, cfg] of triggerConfigs) {
      for (const channel of cfg.channels) {
        if (trigger_type === 'cycle_deadline') {
          await this.generateCycleDeadlineLogs(
            channel,
            cfg.days_before,
            cfg.repeat_interval_days,
            recipients,
            now,
          );
        } else if (trigger_type === 'cycle_unreviewed') {
          await this.generateCycleUnreviewedLogs(
            channel,
            cfg.days_before,
            cfg.repeat_interval_days,
            recipients,
            now,
          );
        } else if (trigger_type === 'contract_ending') {
          await this.generateContractEndingLogs(
            channel,
            cfg.days_before,
            cfg.repeat_interval_days,
            recipients,
            now,
          );
        }
      }
    }
  }

  private async generateCycleDeadlineLogs(
    channel: ReminderChannel,
    daysBefore: number,
    repeatIntervalDays: number,
    recipients: any[],
    now: dayjs.Dayjs,
  ) {
    const threshold = now.add(daysBefore, 'day').toDate();
    const cycles = await this.prisma.reviewCycles.findMany({
      where: { announce_date: { gte: now.toDate(), lte: threshold } },
    });

    for (const cycle of cycles) {
      for (const recipient of recipients) {
        const lastSent = await this.prisma.notificationLogs.findFirst({
          where: {
            trigger_type: 'cycle_deadline',
            channel,
            recipient_id: recipient.id,
            cycle_id: cycle.id,
            status: 'sent',
          },
          orderBy: { sent_at: 'desc' },
        });

        if (lastSent?.sent_at) {
          const daysSinceLast = now.diff(dayjs(lastSent.sent_at), 'day');
          if (daysSinceLast < repeatIntervalDays) continue;
        }

        await this.prisma.notificationLogs.create({
          data: {
            trigger_type: 'cycle_deadline',
            channel,
            recipient_id: recipient.id,
            target_id: recipient.id,
            cycle_id: cycle.id,
            scheduled_at: now.toDate(),
            status: 'pending',
          },
        });
      }
    }
  }

  private async generateCycleUnreviewedLogs(
    channel: ReminderChannel,
    daysBefore: number,
    repeatIntervalDays: number,
    recipients: any[],
    now: dayjs.Dayjs,
  ) {
    const threshold = now.add(daysBefore, 'day').toDate();
    const activeCycles = await this.prisma.reviewCycles.findMany({
      where: { announce_date: { gte: now.toDate(), lte: threshold } },
      include: {
        assignments: { include: { employee: true } },
        reviews: true,
      },
    });

    for (const cycle of activeCycles) {
      const unreviewedEmployees = cycle.assignments.filter(
        (a) => !cycle.reviews.find((r) => r.employee_id === a.employee_id),
      );

      for (const assignment of unreviewedEmployees) {
        for (const recipient of recipients) {
          const lastSent = await this.prisma.notificationLogs.findFirst({
            where: {
              trigger_type: 'cycle_unreviewed',
              channel,
              recipient_id: recipient.id,
              target_id: assignment.employee_id,
              cycle_id: cycle.id,
              status: 'sent',
            },
            orderBy: { sent_at: 'desc' },
          });

          if (lastSent?.sent_at) {
            const daysSinceLast = now.diff(dayjs(lastSent.sent_at), 'day');
            if (daysSinceLast < repeatIntervalDays) continue;
          }

          await this.prisma.notificationLogs.create({
            data: {
              trigger_type: 'cycle_unreviewed',
              channel,
              recipient_id: recipient.id,
              target_id: assignment.employee_id,
              cycle_id: cycle.id,
              scheduled_at: now.toDate(),
              status: 'pending',
            },
          });
        }
      }
    }
  }

  private async generateContractEndingLogs(
    channel: ReminderChannel,
    daysBefore: number,
    repeatIntervalDays: number,
    recipients: any[],
    now: dayjs.Dayjs,
  ) {
    const threshold = now.add(daysBefore, 'day').toDate();
    const employees = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        contract_type: { in: ['intern', 'probation'] },
        terminated_at: { gte: now.toDate(), lte: threshold },
      },
    });

    for (const emp of employees) {
      const hasReview = await this.prisma.performanceReviews.findFirst({
        where: {
          employee_id: emp.id,
          status: { in: ['submitted', 'published'] },
        },
      });
      if (hasReview) continue;

      for (const recipient of recipients) {
        const lastSent = await this.prisma.notificationLogs.findFirst({
          where: {
            trigger_type: 'contract_ending',
            channel,
            recipient_id: recipient.id,
            target_id: emp.id,
            status: 'sent',
          },
          orderBy: { sent_at: 'desc' },
        });

        if (lastSent?.sent_at) {
          const daysSinceLast = now.diff(dayjs(lastSent.sent_at), 'day');
          if (daysSinceLast < repeatIntervalDays) continue;
        }

        await this.prisma.notificationLogs.create({
          data: {
            trigger_type: 'contract_ending',
            channel,
            recipient_id: recipient.id,
            target_id: emp.id,
            scheduled_at: now.toDate(),
            status: 'pending',
          },
        });
      }
    }
  }

  private async dispatchLog(log: any) {
    const emp = log.employee;
    const cycle = log.cycle;
    const daysLeft = emp.terminated_at
      ? dayjs(emp.terminated_at).diff(dayjs.utc(), 'day')
      : null;

    if (log.channel === 'inapp') {
      await this.dispatchInApp(log, emp, cycle, daysLeft);
    } else if (log.channel === 'email') {
      await this.dispatchEmail(log, emp, cycle, daysLeft);
    }
  }

  private async dispatchInApp(
    log: any,
    emp: any,
    cycle: any,
    daysLeft: number | null,
  ) {
    const { title, body, link, type } = this.buildNotificationContent(
      log,
      emp,
      cycle,
      daysLeft,
    );

    const admins = await this.prisma.employees.findMany({
      where: { status: 'active', manager_id: null },
      select: { id: true },
    });

    const recipients = new Set<string>([log.recipient_id]);
    admins.forEach((a) => recipients.add(a.id));

    for (const userId of recipients) {
      await this.prisma.notifications.create({
        data: {
          user_id: userId,
          type: type as any,
          title,
          body,
          link,
          is_read: false,
        },
      });
    }
  }

  private async dispatchEmail(
    log: any,
    emp: any,
    cycle: any,
    daysLeft: number | null,
  ) {
    const recipientEmp = await this.prisma.employees.findUnique({
      where: { id: log.recipient_id },
      select: { email: true, full_name: true },
    });
    if (!recipientEmp?.email) return;

    const { title, body } = this.buildNotificationContent(
      log,
      emp,
      cycle,
      daysLeft,
    );
    const link = this.buildLink(log);

    await this.mailService.sendReminderEmail({
      to: recipientEmp.email,
      recipientName: recipientEmp.full_name,
      subject: `[Nhắc nhở] ${title}`,
      body,
      ctaUrl: `${process.env.VITE_APP_URL ?? 'http://localhost:5173'}${link}`,
      ctaLabel: 'Tạo đánh giá ngay',
    });
  }

  private buildNotificationContent(
    log: any,
    emp: any,
    cycle: any,
    daysLeft: number | null,
  ): { title: string; body: string; link: string; type: string } {
    switch (log.trigger_type) {
      case 'contract_ending':
        return {
          type: 'eval_reminder_contract_ending',
          title: `${emp.full_name} sắp kết thúc ${emp.contract_type === 'intern' ? 'thực tập' : 'thử việc'}`,
          body: `${emp.full_name} còn ${daysLeft} ngày trước khi kết thúc ${emp.contract_type === 'intern' ? 'thực tập' : 'thử việc'} và chưa có đánh giá.`,
          link: `performance/review`,
        };
      case 'cycle_deadline':
        return {
          type: 'eval_deadline_reminder',
          title: `Chu kỳ đánh giá "${cycle?.title}" sắp đến deadline`,
          body: `Chu kỳ "${cycle?.title}" còn ${daysLeft} ngày trước deadline. Hãy hoàn thành các đánh giá còn lại.`,
          link: `performance/cycles`,
        };
      case 'cycle_unreviewed':
        return {
          type: 'eval_deadline_reminder',
          title: `${emp.full_name} chưa được đánh giá trong chu kỳ "${cycle?.title}"`,
          body: `Nhân viên ${emp.full_name} chưa có đánh giá trong chu kỳ "${cycle?.title}". Vui lòng tạo đánh giá.`,
          link: `performance/review`,
        };
      default:
        return {
          type: 'eval_deadline_reminder',
          title: 'Nhắc nhở đánh giá',
          body: '',
          link: '/performance/review',
        };
    }
  }

  private buildLink(log: any): string {
    if (log.trigger_type === 'cycle_deadline' && log.cycle_id) {
      return `performance/cycles`;
    }
    return `performance/review`;
  }
}
