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
  QueryLeaveRequestDto,
} from './dto/leave-request.dto';
import { HolidayService } from 'src/modules/holidays/holiday.service';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidayService: HolidayService,
  ) {}

  async findAll(query: QueryLeaveRequestDto) {
    const where: any = {};
    if (query.employee_id) where.employee_id = query.employee_id;
    if (query.status) where.status = query.status;

    const requests = await this.prisma.leaveRequests.findMany({
      where,
      include: {
        employee: {
          select: { id: true, full_name: true, employee_code: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return ResponseHelper.success(requests);
  }

  async findOne(id: string) {
    const request = await this.prisma.leaveRequests.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, full_name: true, employee_code: true },
        },
      },
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
      include: { work_schedules: true },
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
    return ResponseHelper.success(created, 'Leave request submitted');
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);

    const data: any = { status: dto.status };
    if (dto.status === LeaveStatus.approved) {
      data.admin_approved_at = new Date();
    }

    const updated = await this.prisma.leaveRequests.update({
      where: { id },
      data,
    });
    return ResponseHelper.success(updated, `Leave request ${dto.status}`);
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
