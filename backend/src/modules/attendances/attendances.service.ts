import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import {
  getMonthRange,
  getWorkingDaysInMonth,
} from '../../common/utils/date.util';
import {
  resolvePagination,
  buildPaginatedResult,
} from '../../common/utils/pagination.util';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { AttendanceStatus, LeaveStatus } from '@prisma/client';

@Injectable()
export class AttendancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAttendanceDto) {
    const { skip, take, ...meta } = resolvePagination(query);

    const where: any = {};
    if (query.month && query.year) {
      where.work_date = getMonthRange(query.month, query.year);
    }

    const [attendances, count] = await this.prisma.$transaction([
      this.prisma.attendances.findMany({
        where,
        skip,
        take,
        include: { employee: true },
        orderBy: { work_date: 'desc' },
      }),
      this.prisma.attendances.count({ where }),
    ]);

    return ResponseHelper.success(
      buildPaginatedResult(attendances, count, { skip, take, ...meta }),
    );
  }

  async findSummaries(month: number, year: number) {
    const attendances = await this.prisma.attendances.findMany({
      where: { work_date: getMonthRange(month, year) },
      include: { employee: true },
    });

    const employees = await this.prisma.employees.findMany();

    const summaryMap = new Map();

    employees.forEach((emp) => {
      summaryMap.set(emp.id, {
        employee_id: emp.id,
        employee: emp,
        plan_day: getWorkingDaysInMonth(month, year),
        actual_day: 0,
        late: 0,
        absent: 0,
        annual_leave: 0,
        unpaid_leave: 0,
        over_time: 0,
        records: [],
      });
    });

    attendances.forEach((att) => {
      if (summaryMap.has(att.employee_id)) {
        const stats = summaryMap.get(att.employee_id);
        stats.records.push(att);
        if (att.status === 'approved') stats.actual_day += 1;
        if (att.late > 0) stats.late += 1;
        stats.over_time += att.overtime || 0;
      }
    });

    return Array.from(summaryMap.values());
  }

  async findByEmployee(employeeId: string, month: number, year: number) {
    const monthRange = getMonthRange(month, year);

    const [records, employee, leaveRequests] = await this.prisma.$transaction([
      this.prisma.attendances.findMany({
        where: { employee_id: employeeId, work_date: monthRange },
        orderBy: { work_date: 'asc' },
      }),
      this.prisma.employees.findUnique({
        where: { id: employeeId },
        include: { position: true },
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
    const actualDay = records.filter((r) => r.status === 'approved').length;
    const lateCount = records.filter((r) => r.late > 0).length;
    const overtimeTotal = records.reduce(
      (sum, r) => sum + (r.overtime || 0),
      0,
    );

    return ResponseHelper.success({
      employee,
      records,
      leave_requests: leaveRequests,
      summary: {
        plan_day: planDay,
        actual_day: actualDay,
        late: lateCount,
        absent: planDay - actualDay,
        over_time: overtimeTotal,
      },
    });
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

  async updateLeaveRequest(id: string, status: LeaveStatus) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);

    const updated = await this.prisma.leaveRequests.update({
      where: { id },
      data: { status },
    });

    return ResponseHelper.success(updated, `Leave request ${status}`);
  }

  async create(data: CreateAttendanceDto) {
    return this.prisma.attendances.create({
      data: {
        employee_id: data.employee_id,
        work_date: new Date(data.work_date),
        check_in_time: data.check_in_time ? new Date(data.check_in_time) : null,
        check_out_time: data.check_out_time
          ? new Date(data.check_out_time)
          : null,
        check_in_lat: data.check_in_lat,
        check_in_lng: data.check_in_lng,
        check_out_lat: data.check_out_lat,
        check_out_lng: data.check_out_lng,
        late: data.late || 0,
        early_leave: data.early_leave || 0,
        overtime: data.overtime || 0,
        status: data.status || AttendanceStatus.pending,
      },
      include: { employee: true },
    });
  }

  async update(id: string, data: UpdateAttendanceDto) {
    const existing = await this.prisma.attendances.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Attendance with ID ${id} not found`);

    return this.prisma.attendances.update({
      where: { id },
      data: {
        check_in_time: data.check_in_time
          ? new Date(data.check_in_time)
          : undefined,
        check_out_time: data.check_out_time
          ? new Date(data.check_out_time)
          : undefined,
        check_in_lat: data.check_in_lat,
        check_in_lng: data.check_in_lng,
        check_out_lat: data.check_out_lat,
        check_out_lng: data.check_out_lng,
        late: data.late,
        early_leave: data.early_leave,
        overtime: data.overtime,
        status: data.status,
      },
      include: { employee: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.attendances.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Attendance with ID ${id} not found`);

    return this.prisma.attendances.delete({ where: { id } });
  }
}
