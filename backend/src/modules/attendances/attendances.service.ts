import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import {
  getMonthRange,
  getWorkingDaysInMonth,
  dateToMinutes,
  overlapMinutes,
} from '../../common/utils/date.util';
import {
  resolvePagination,
  buildPaginatedResult,
} from '../../common/utils/pagination.util';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { WorkPolicyService } from '../work-policies/work-policy.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceAction, AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workPolicyService: WorkPolicyService,
  ) {}

  async checkIn(dto: CheckInDto) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = new Date(timestamp);
    workDate.setHours(0, 0, 0, 0);

    const schedule = await this.prisma.employeeWorkSchedules.findFirst({
      where: { employee_id: dto.employee_id },
    });
    if (!schedule)
      throw new BadRequestException('No work schedule found for employee');

    // Snapshot active policy at check-in time
    const policyRes = await this.workPolicyService.getActive(timestamp);
    const policy = policyRes.data;

    const attendance = await this.prisma.attendances.upsert({
      where: {
        employee_id_work_date: {
          employee_id: dto.employee_id,
          work_date: workDate,
        },
      },
      create: {
        employee_id: dto.employee_id,
        work_date: workDate,
        scheduled_start: schedule.start_time,
        scheduled_end: schedule.end_time,
        break_start: policy?.break_start ?? null,
        break_end: policy?.break_end ?? null,
        flexible_start: policy?.is_flexible_enabled
          ? (policy.flexible_start_minutes ?? null)
          : null,
        flexible_end: policy?.is_flexible_enabled
          ? (policy.flexible_end_minutes ?? null)
          : null,
        check_in_time: timestamp,
        status: AttendanceStatus.pending,
      },
      update: { check_in_time: timestamp },
    });

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_in,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: dto.ip_address ?? null,
        user_agent: dto.user_agent ?? null,
      },
    });

    const checkInMinutes = dateToMinutes(timestamp);
    // Grace window: check-in within flexible_start_minutes after scheduled_start = on time
    const graceLate = policy?.is_flexible_enabled
      ? (policy.flexible_start_minutes ?? 0)
      : 0;
    const late = Math.max(
      0,
      checkInMinutes - (schedule.start_time + graceLate),
    );

    await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: { late },
    });

    return ResponseHelper.success(
      { ...attendance, late },
      'Checked in successfully',
    );
  }

  async checkOut(dto: CheckOutDto) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = new Date(timestamp);
    workDate.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendances.findUnique({
      where: {
        employee_id_work_date: {
          employee_id: dto.employee_id,
          work_date: workDate,
        },
      },
    });
    if (!attendance) throw new NotFoundException('No check-in found for today');
    if (!attendance.check_in_time)
      throw new BadRequestException('Must check-in first');

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_out,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: dto.ip_address ?? null,
        user_agent: dto.user_agent ?? null,
      },
    });

    const checkInMin = dateToMinutes(attendance.check_in_time);
    const checkOutMin = dateToMinutes(timestamp);
    const gross = Math.max(0, checkOutMin - checkInMin);

    let breakDeduction = 0;
    if (attendance.break_start != null && attendance.break_end != null) {
      breakDeduction = overlapMinutes(
        checkInMin,
        checkOutMin,
        attendance.break_start,
        attendance.break_end,
      );
    }
    const workMinutes = Math.max(0, gross - breakDeduction);
    const earlyLeave = Math.max(0, attendance.scheduled_end - checkOutMin);
    // Grace window: check-out within flexible_end_minutes before scheduled_end = full day
    const graceEarly = attendance.flexible_end ?? 0;
    const earlyLeaveAdjusted = Math.max(0, earlyLeave - graceEarly);
    const overtime = Math.max(0, checkOutMin - attendance.scheduled_end);

    const updated = await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: {
        check_out_time: timestamp,
        work_minutes: workMinutes,
        early_leave: earlyLeaveAdjusted,
        overtime,
      },
    });

    return ResponseHelper.success(updated, 'Checked out successfully');
  }

  async findAll(query: QueryAttendanceDto) {
    const { skip, take, ...meta } = resolvePagination(query);
    const where: any = {};
    if (query.month && query.year)
      where.work_date = getMonthRange(query.month, query.year);
    if (query.employee_id) where.employee_id = query.employee_id;

    const [attendances, count] = await this.prisma.$transaction([
      this.prisma.attendances.findMany({
        where,
        skip,
        take,
        include: {
          employee: {
            include: { position: { include: { department: true } } },
          },
          logs: { orderBy: { timestamp: 'asc' } },
        },
        orderBy: { work_date: 'desc' },
      }),
      this.prisma.attendances.count({ where }),
    ]);

    return ResponseHelper.success(
      buildPaginatedResult(attendances, count, { skip, take, ...meta }),
    );
  }

  async findSummaries(month: number, year: number) {
    const [attendances, employees] = await this.prisma.$transaction([
      this.prisma.attendances.findMany({
        where: { work_date: getMonthRange(month, year) },
        include: {
          employee: {
            include: { position: { include: { department: true } } },
          },
        },
      }),
      this.prisma.employees.findMany({
        include: { position: { include: { department: true } } },
      }),
    ]);

    const planDay = getWorkingDaysInMonth(month, year);
    const summaryMap = new Map<string, any>();

    employees.forEach((emp) => {
      summaryMap.set(emp.id, {
        employee_id: emp.id,
        employee: emp,
        plan_day: planDay,
        actual_day: 0,
        late: 0,
        absent: 0,
        over_time: 0,
        work_minutes: 0,
        records: [],
      });
    });

    attendances.forEach((att) => {
      const stats = summaryMap.get(att.employee_id);
      if (!stats) return;
      stats.records.push(att);
      if (att.status === AttendanceStatus.approved) stats.actual_day += 1;
      if (att.late > 0) stats.late += 1;
      stats.over_time += att.overtime ?? 0;
      stats.work_minutes += att.work_minutes ?? 0;
    });

    summaryMap.forEach((s) => {
      s.absent = Math.max(0, s.plan_day - s.actual_day);
    });

    return ResponseHelper.success(Array.from(summaryMap.values()));
  }

  async findByEmployee(employeeId: string, month: number, year: number) {
    const monthRange = getMonthRange(month, year);

    const [records, employee, leaveRequests] = await this.prisma.$transaction([
      this.prisma.attendances.findMany({
        where: { employee_id: employeeId, work_date: monthRange },
        include: { logs: { orderBy: { timestamp: 'asc' } } },
        orderBy: { work_date: 'asc' },
      }),
      this.prisma.employees.findUnique({
        where: { id: employeeId },
        include: {
          position: { include: { department: true } },
          work_schedules: true,
        },
      }),
      this.prisma.leaveRequests.findMany({
        where: {
          employee_id: employeeId,
          start_date: { lte: monthRange.lte },
          end_date: { gte: monthRange.gte },
        },
      }),
    ]);

    if (!employee)
      throw new NotFoundException(`Employee ${employeeId} not found`);

    const planDay = getWorkingDaysInMonth(month, year);
    const actualDay = records.filter(
      (r) => r.status === AttendanceStatus.approved,
    ).length;

    return ResponseHelper.success({
      employee,
      records,
      leave_requests: leaveRequests,
      summary: {
        plan_day: planDay,
        actual_day: actualDay,
        late: records.filter((r) => r.late > 0).length,
        absent: Math.max(0, planDay - actualDay),
        over_time: records.reduce((s, r) => s + (r.overtime ?? 0), 0),
        work_minutes: records.reduce((s, r) => s + (r.work_minutes ?? 0), 0),
      },
    });
  }

  async create(dto: CreateAttendanceDto) {
    const existing = await this.prisma.attendances.findUnique({
      where: {
        employee_id_work_date: {
          employee_id: dto.employee_id,
          work_date: new Date(dto.work_date),
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        'Attendance record already exists for this date',
      );

    const created = await this.prisma.attendances.create({
      data: {
        employee_id: dto.employee_id,
        work_date: new Date(dto.work_date),
        scheduled_start: dto.scheduled_start,
        scheduled_end: dto.scheduled_end,
        break_start: dto.break_start ?? null,
        break_end: dto.break_end ?? null,
        flexible_start: dto.flexible_start ?? null,
        flexible_end: dto.flexible_end ?? null,
        check_in_time: dto.check_in_time ? new Date(dto.check_in_time) : null,
        check_out_time: dto.check_out_time
          ? new Date(dto.check_out_time)
          : null,
        status: dto.status ?? AttendanceStatus.pending,
      },
      include: { employee: true, logs: true },
    });
    return ResponseHelper.success(created, 'Attendance created');
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendances.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Attendance ${id} not found`);

    let workMinutes = dto.work_minutes;
    if (dto.check_in_time && dto.check_out_time && workMinutes === undefined) {
      const inMin = dateToMinutes(new Date(dto.check_in_time));
      const outMin = dateToMinutes(new Date(dto.check_out_time));
      const gross = Math.max(0, outMin - inMin);
      let breakDed = 0;
      if (existing.break_start != null && existing.break_end != null) {
        breakDed = overlapMinutes(
          inMin,
          outMin,
          existing.break_start,
          existing.break_end,
        );
      }
      workMinutes = Math.max(0, gross - breakDed);
    }

    const updated = await this.prisma.attendances.update({
      where: { id },
      data: {
        check_in_time: dto.check_in_time
          ? new Date(dto.check_in_time)
          : undefined,
        check_out_time: dto.check_out_time
          ? new Date(dto.check_out_time)
          : undefined,
        late: dto.late,
        early_leave: dto.early_leave,
        overtime: dto.overtime,
        work_minutes: workMinutes,
        status: dto.status,
      },
      include: { employee: true, logs: true },
    });
    return ResponseHelper.success(updated, 'Attendance updated');
  }

  async remove(id: string) {
    const existing = await this.prisma.attendances.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Attendance ${id} not found`);
    await this.prisma.attendances.delete({ where: { id } });
    return ResponseHelper.success(null, 'Attendance deleted');
  }

  async approveEmployeeTimesheet(
    employeeId: string,
    month: number,
    year: number,
  ) {
    const updated = await this.prisma.attendances.updateMany({
      where: {
        employee_id: employeeId,
        work_date: getMonthRange(month, year),
        status: AttendanceStatus.pending,
      },
      data: { status: AttendanceStatus.approved },
    });
    return ResponseHelper.success(
      { updated: updated.count },
      'Timesheet approved',
    );
  }
}
