import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { LeaveStatus, NotificationType } from '@prisma/client';
import { fmtDate } from 'src/common/utils/date.util';

export interface CreateNotificationDto {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notifications.create({ data: dto });
  }

  async createMany(dtos: CreateNotificationDto[]) {
    if (!dtos.length) return;
    await this.prisma.notifications.createMany({ data: dtos });
  }

  async getForUser(employeeId: string) {
    const notifications = await this.prisma.notifications.findMany({
      where: { user_id: employeeId },
      orderBy: [{ is_read: 'asc' }, { created_at: 'desc' }],
      take: 50,
    });
    const unread_count = notifications.filter((n) => !n.is_read).length;
    return ResponseHelper.success({ notifications, unread_count });
  }

  async markRead(id: string, employeeId: string) {
    await this.prisma.notifications.updateMany({
      where: { id, user_id: employeeId },
      data: { is_read: true },
    });
    return ResponseHelper.success(null);
  }

  async markAllRead(employeeId: string) {
    await this.prisma.notifications.updateMany({
      where: { user_id: employeeId, is_read: false },
      data: { is_read: true },
    });
    return ResponseHelper.success(null);
  }

  async notifyLeaveSubmitted(opts: {
    managerEmployeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    submissionId: string;
  }) {
    await this.create({
      user_id: opts.managerEmployeeId,
      type: NotificationType.leave_submitted,
      title: 'New Leave Request',
      body: `${opts.employeeName} submitted a ${opts.leaveType} leave request (${fmtDate(opts.startDate)} – ${fmtDate(opts.endDate)})`,
      link: 'leave-requests',
    });
  }

  async notifyLeaveStatusChanged(opts: {
    employeeId: string;
    status: (typeof LeaveStatus)['approved' | 'rejected'];
    leaveType: string;
    startDate: string;
    endDate: string;
  }) {
    const approved = opts.status === LeaveStatus.approved;
    await this.create({
      user_id: opts.employeeId,
      type: approved
        ? NotificationType.leave_approved
        : NotificationType.leave_rejected,
      title: approved ? 'Leave Request Approved' : 'Leave Request Rejected',
      body: `Your ${opts.leaveType} leave (${fmtDate(opts.startDate)} – ${fmtDate(opts.endDate)}) has been ${opts.status}`,
      link: 'leave-requests',
    });
  }

  async notifyTimesheetApproved(opts: {
    employeeId: string;
    month: number;
    year: number;
  }) {
    await this.create({
      user_id: opts.employeeId,
      type: NotificationType.timesheet_approved,
      title: 'Timesheet Approved',
      body: `Your timesheet for ${opts.month}/${opts.year} has been approved`,
      link: 'my/timesheet',
    });
  }
}
