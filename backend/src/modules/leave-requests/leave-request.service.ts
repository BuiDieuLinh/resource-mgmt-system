import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  UpdateLeaveRequestDto,
  QueryLeaveRequestDto,
} from './dto/leave-request.dto';
import { HolidayService } from 'src/modules/holidays/holiday.service';
import { EmployeeStatus, LeaveStatus, PositionLevel } from '@prisma/client';
import { Role } from 'src/common/constant/roles';

import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidayService: HolidayService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getManagerDepartmentId(employeeId: string): Promise<string | null> {
    const employee = await this.prisma.employees.findUnique({
      where: { id: employeeId },
      select: { position: { select: { department_id: true } } },
    });
    return employee?.position?.department_id ?? null;
  }

  private readonly leaveInclude = {
    employee: {
      select: { id: true, full_name: true, employee_code: true },
    },
    approver_manager: { select: { id: true, full_name: true } },
    approver_admin: { select: { id: true, full_name: true } },
  } as const;

  async findByEmployee(employeeId: string, status?: string) {
    const requests = await this.prisma.leaveRequests.findMany({
      where: {
        employee_id: employeeId,
        ...(status ? { status: status as LeaveStatus } : {}),
      },
      include: this.leaveInclude,
      orderBy: { created_at: 'desc' },
    });
    return ResponseHelper.success(requests);
  }

  async findAll(query: QueryLeaveRequestDto) {
    const where: any = {};
    if (query.employee_id?.length) {
      where.employee_id =
        query.employee_id.length === 1
          ? query.employee_id[0]
          : { in: query.employee_id };
    }
    if (query.status?.length) {
      where.status =
        query.status.length === 1 ? query.status[0] : { in: query.status };
    }
    if (query.department_id?.length) {
      where.employee = {
        position: {
          department_id:
            query.department_id.length === 1
              ? query.department_id[0]
              : { equals: query.department_id },
        },
      };
    }
    if (query.month && query.year) {
      const startOfMonth = new Date(query.year, query.month - 1, 1);
      const endOfMonth = new Date(query.year, query.month, 1);
      where.start_date = {
        gte: startOfMonth,
        lt: endOfMonth,
      };
    } else if (query.year) {
      const startOfYear = new Date(query.year, 0, 1);
      const endOfYear = new Date(query.year + 1, 0, 1);
      where.start_date = {
        gte: startOfYear,
        lt: endOfYear,
      };
    }

    const pageIndex = query.pageIndex ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (pageIndex - 1) * pageSize;

    const [requests, count] = await this.prisma.$transaction([
      this.prisma.leaveRequests.findMany({
        where,
        include: this.leaveInclude,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.leaveRequests.count({ where }),
    ]);

    return ResponseHelper.success({
      data: requests,
      count,
      pageIndex,
      pageSize,
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.leaveRequests.findUnique({
      where: { id },
      include: this.leaveInclude,
    });
    if (!request) throw new NotFoundException(`Leave request ${id} not found`);
    return ResponseHelper.success(request);
  }

  async create(dto: CreateLeaveRequestDto) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate < startDate) {
      throw new BadRequestException('end_date must be on or after start_date');
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (startDate < currentMonthStart) {
      throw new BadRequestException(
        `Cannot create leave request in the past. Start date must be within the current month (${currentMonthStart.toISOString().slice(0, 7)}) or later`,
      );
    }

    const employee = await this.prisma.employees.findUnique({
      where: { id: dto.employee_id },
      include: {
        work_schedules: true,
        position: { select: { department_id: true } },
      },
    });
    if (!employee)
      throw new NotFoundException(`Employee ${dto.employee_id} not found`);

    const workingDows = new Set(
      employee.work_schedules.map((s) => s.day_of_week),
    );

    const years = new Set<number>();
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      years.add(d.getFullYear());
    }
    const holidayDates = new Set<string>();
    for (const y of years) {
      const set = await this.holidayService.getHolidayDateSet(y);
      set.forEach((d) => holidayDates.add(d));
    }

    const invalidDays: string[] = [];
    const holidayConflicts: string[] = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const iso = d.toISOString().slice(0, 10);
      const jsDay = d.getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1;

      if (holidayDates.has(iso)) {
        holidayConflicts.push(iso);
      } else if (workingDows.size > 0 && !workingDows.has(dow)) {
        invalidDays.push(iso);
      }
    }

    if (holidayConflicts.length > 0) {
      throw new BadRequestException(
        `Leave request includes public holiday(s): ${holidayConflicts.join(', ')}`,
      );
    }
    if (invalidDays.length > 0) {
      throw new BadRequestException(
        `Leave request includes non-working day(s): ${invalidDays.join(', ')}`,
      );
    }

    const overlap = await this.prisma.leaveRequests.findFirst({
      where: {
        employee_id: dto.employee_id,
        status: { not: LeaveStatus.rejected },
        start_date: { lte: endDate },
        end_date: { gte: startDate },
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `Employee already has a leave request overlapping this period (${overlap.start_date.toISOString().slice(0, 10)} – ${overlap.end_date.toISOString().slice(0, 10)})`,
      );
    }

    const created = await this.prisma.leaveRequests.create({
      data: {
        employee_id: dto.employee_id,
        leave_type: dto.leave_type,
        start_date: startDate,
        end_date: endDate,
        leave_start_minutes: dto.leave_start_minutes ?? null,
        leave_end_minutes: dto.leave_end_minutes ?? null,
        reason: dto.reason ?? null,
      },
    });

    if (employee.position?.department_id) {
      const manager = await this.prisma.employees.findFirst({
        where: {
          status: EmployeeStatus.active,
          position: {
            department_id: employee.position.department_id,
            level: PositionLevel.manager,
          },
          NOT: { id: employee.id },
        },
      });
      if (manager?.id) {
        await this.notificationsService.notifyLeaveSubmitted({
          managerEmployeeId: manager.id,
          employeeName: employee.full_name,
          leaveType: dto.leave_type,
          startDate: dto.start_date,
          endDate: dto.end_date,
          submissionId: created.id,
        });
      }
    }

    return ResponseHelper.success(created, 'Leave request submitted');
  }

  async update(id: string, dto: UpdateLeaveRequestDto) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);
    if (existing.status !== LeaveStatus.pending) {
      throw new BadRequestException(
        'Only pending leave requests can be updated',
      );
    }
    const updated = await this.prisma.leaveRequests.update({
      where: { id },
      data: {
        ...(dto.leave_type && { leave_type: dto.leave_type }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.leave_start_minutes !== undefined && {
          leave_start_minutes: dto.leave_start_minutes,
        }),
        ...(dto.leave_end_minutes !== undefined && {
          leave_end_minutes: dto.leave_end_minutes,
        }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
      },
    });
    return ResponseHelper.success(updated, 'Leave request updated');
  }

  async updateStatus(
    id: string,
    dto: UpdateLeaveStatusDto,
    actorEmployeeId?: string,
    actorRoles: string[] = [],
  ) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, auth_user_id: true } },
      },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);
    if (existing.status !== LeaveStatus.pending) {
      throw new BadRequestException(
        'This leave request has already been finalized',
      );
    }

    const actorEmployee = actorEmployeeId
      ? await this.prisma.employees.findUnique({
          where: { id: actorEmployeeId },
          select: { id: true, position: { select: { level: true } } },
        })
      : null;

    const isAdmin = actorRoles.includes(Role.ADMIN);
    const isHR = actorRoles.includes(Role.HR);
    const isManager =
      !isAdmin &&
      !isHR &&
      actorEmployee?.position?.level === PositionLevel.manager;

    if (actorEmployee && existing.employee?.id === actorEmployee.id) {
      throw new BadRequestException(
        'You cannot approve or reject your own leave request',
      );
    }

    if (isManager && existing.approved_by_admin) {
      throw new BadRequestException('Admin has already finalized this request');
    }
    if (isManager && existing.approved_by_manager) {
      throw new BadRequestException('You have already reviewed this request');
    }
    if ((isHR || isAdmin) && existing.approved_by_admin) {
      throw new BadRequestException(
        'HR/Admin has already reviewed this request',
      );
    }

    const now = new Date();
    const data: any = {};

    if (isManager) {
      data.approved_by_manager = actorEmployee!.id;
      data.manager_approved_at = now;
      data.manager_comment = dto.comment ?? null;
      if (dto.status === LeaveStatus.rejected) {
        data.status = LeaveStatus.rejected;
      }
    } else {
      data.approved_by_admin = actorEmployee!.id;
      data.admin_approved_at = now;
      data.admin_comment = dto.comment ?? null;
      data.status = dto.status;
    }

    const updated = await this.prisma.leaveRequests.update({
      where: { id },
      data,
      include: {
        employee: { select: { id: true, full_name: true } },
      },
    });

    if (data.status && updated.employee?.id) {
      await this.notificationsService.notifyLeaveStatusChanged({
        employeeId: updated.employee.id,
        status: data.status as 'approved' | 'rejected',
        leaveType: existing.leave_type,
        startDate: existing.start_date.toISOString().slice(0, 10),
        endDate: existing.end_date.toISOString().slice(0, 10),
      });
    }

    return ResponseHelper.success(
      updated,
      `Leave request ${data.status ?? 'reviewed'}`,
    );
  }

  async bulkUpdateStatus(
    ids: string[],
    dto: { status: LeaveStatus; comment?: string },
    actorEmployeeId: string,
    actorRoles: string[],
  ) {
    const results = await Promise.allSettled(
      ids.map((id) =>
        this.updateStatus(
          id,
          { status: dto.status, comment: dto.comment },
          actorEmployeeId,
          actorRoles,
        ),
      ),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return ResponseHelper.success(
      { succeeded, failed },
      `Bulk ${dto.status}: ${succeeded} succeeded, ${failed} failed`,
    );
  }

  async remove(id: string) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);
    await this.prisma.leaveRequests.delete({ where: { id } });
    return ResponseHelper.success(null, 'Leave request deleted');
  }
}
