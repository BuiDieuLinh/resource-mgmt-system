import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import {
  getMonthRange,
  getWorkingDaysInMonth,
  getWorkingDaysUpToToday,
  dateToMinutes,
  overlapMinutes,
  toLocalWorkDate,
  minutesToTime,
} from '../../common/utils/date.util';
import {
  resolvePagination,
  buildPaginatedResult,
} from '../../common/utils/pagination.util';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { WorkPolicyService } from '../work-policies/work-policy.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CheckInFaceDto } from './dto/check-in-face.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  AttendanceAction,
  AttendanceStatus,
  EmployeeStatus,
  LeaveStatus,
  LeaveType,
  WorkPolicies,
} from '@prisma/client';
import { FaceVerificationService } from './services/face-verification.service';
import { AttendanceValidationService } from './services/attendance-validate.service';
import { DeviceInfoService } from './services/device-info.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import {
  getQuarter,
  resolveQuarterEntitledDays,
  toSafeFilePart,
} from './utils/checkin-with-face';

@Injectable()
export class AttendancesService {
  private readonly logger = new Logger(AttendancesService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workPolicyService: WorkPolicyService,
    private readonly attendanceValidationService: AttendanceValidationService,
    private readonly deviceInfoService: DeviceInfoService,
    private readonly faceVerificationService: FaceVerificationService,
    private readonly config: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.config.get<string>('R2_ENDPOINT') || '',
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY') || '',
        secretAccessKey: this.config.get<string>('R2_SECRET_KEY') || '',
      },
    });
    this.bucketName = this.config.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || '';
  }

  private async uploadSelfieToR2(
    selfie: Express.Multer.File,
    employeeName: string,
  ): Promise<string> {
    if (!selfie?.buffer?.length) {
      throw new BadRequestException('Selfie image is required');
    }

    const extension = selfie.mimetype === 'image/png' ? 'png' : 'jpg';
    const safeEmployeeName = toSafeFilePart(employeeName) || 'unknown-employee';
    const fileName = `selfies/${safeEmployeeName}/${randomUUID()}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: selfie.buffer,
        ContentType: selfie.mimetype,
      }),
    );

    return `${this.publicUrl}/${fileName}`;
  }

  private calculateLeaveRequestDays(
    leave: {
      start_date: Date;
      end_date: Date;
      leave_start_minutes?: number | null;
      leave_end_minutes?: number | null;
    },
    workingDows: Set<number>,
    holidayDates: Set<string>,
    dailyScheduleMinutes: Map<number, number>,
  ) {
    let totalDays = 0;

    for (
      const d = new Date(leave.start_date);
      d <= leave.end_date;
      d.setDate(d.getDate() + 1)
    ) {
      const day = new Date(d);
      const iso = day.toISOString().slice(0, 10);
      const jsDay = day.getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1;

      if (holidayDates.has(iso)) continue;
      if (workingDows.size > 0 && !workingDows.has(dow)) continue;

      let dayValue = 1;
      const scheduleMinutes = dailyScheduleMinutes.get(dow);
      const isSingleDay =
        iso === leave.start_date.toISOString().slice(0, 10) &&
        iso === leave.end_date.toISOString().slice(0, 10);

      if (
        isSingleDay &&
        scheduleMinutes &&
        leave.leave_start_minutes != null &&
        leave.leave_end_minutes != null &&
        leave.leave_end_minutes > leave.leave_start_minutes
      ) {
        const requestedMinutes =
          leave.leave_end_minutes - leave.leave_start_minutes;
        dayValue = Math.min(1, requestedMinutes / scheduleMinutes);
      }

      totalDays += dayValue;
    }

    return Number(totalDays.toFixed(2));
  }

  private async buildAnnualLeaveBalance(
    employee: {
      id: string;
      annual_leave_days: number;
      work_schedules: {
        day_of_week: number;
        start_time: number;
        end_time: number;
      }[];
    },
    referenceDate: Date,
  ) {
    const year = referenceDate.getFullYear();
    const quarter = getQuarter(referenceDate.getMonth() + 1);
    const entitledDays = resolveQuarterEntitledDays(
      employee.annual_leave_days,
      quarter,
    );
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const approvedAnnualLeaves = await this.prisma.leaveRequests.findMany({
      where: {
        employee_id: employee.id,
        leave_type: LeaveType.annual,
        status: LeaveStatus.approved,
        start_date: { lte: yearEnd },
        end_date: { gte: yearStart },
      },
      select: {
        start_date: true,
        end_date: true,
        leave_start_minutes: true,
        leave_end_minutes: true,
      },
    });

    const years = new Set<number>();
    for (
      const d = new Date(yearStart);
      d <= yearEnd;
      d.setDate(d.getDate() + 1)
    ) {
      years.add(d.getFullYear());
    }

    const holidayDates = new Set<string>();
    for (const holidayYear of years) {
      const set = await this.prisma.holidays.findMany({
        where: {
          holiday_date: {
            gte: new Date(holidayYear, 0, 1),
            lte: new Date(holidayYear, 11, 31),
          },
        },
        select: { holiday_date: true },
      });
      set.forEach((holiday) =>
        holidayDates.add(holiday.holiday_date.toISOString().slice(0, 10)),
      );
    }

    const workingDows = new Set(
      employee.work_schedules.map((schedule) => schedule.day_of_week),
    );
    const dailyScheduleMinutes = new Map(
      employee.work_schedules.map((schedule) => [
        schedule.day_of_week,
        Math.max(1, schedule.end_time - schedule.start_time),
      ]),
    );

    const usedDays = approvedAnnualLeaves.reduce(
      (sum, leave) =>
        sum +
        this.calculateLeaveRequestDays(
          leave,
          workingDows,
          holidayDates,
          dailyScheduleMinutes,
        ),
      0,
    );

    return {
      annual_leave_days: employee.annual_leave_days,
      year,
      quarter,
      entitled_days: entitledDays,
      used_days: Number(usedDays.toFixed(2)),
      remaining_days: Number((entitledDays - usedDays).toFixed(2)),
      year_end_remaining_days: Number(
        (employee.annual_leave_days - usedDays).toFixed(2),
      ),
    };
  }

  async checkInWithFace(
    dto: CheckInFaceDto,
    selfie: Express.Multer.File,
    req: Request,
  ) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = toLocalWorkDate(timestamp);

    const employee = await this.prisma.employees.findUnique({
      where: { id: dto.employee_id },
      select: { id: true, full_name: true, face_descriptor: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const dayOfWeek = workDate.getDay() === 0 ? 6 : workDate.getDay() - 1;
    const schedule = await this.prisma.employeeWorkSchedules.findFirst({
      where: {
        employee_id: dto.employee_id,
        day_of_week: dayOfWeek,
      },
    });
    if (!schedule)
      throw new BadRequestException(
        'No work schedule found for employee today',
      );

    const checkInMinutes = dateToMinutes(timestamp);
    if (checkInMinutes > schedule.end_time) {
      throw new BadRequestException(
        `Check-in not allowed after work hours end (${minutesToTime(schedule.end_time)} PM). Current time: ${minutesToTime(checkInMinutes)} PM.`,
      );
    }

    const policyRes = await this.workPolicyService.getActive(timestamp);
    const policy = policyRes.data;

    this.attendanceValidationService.validateGps(
      policy as WorkPolicies,
      dto.latitude,
      dto.longitude,
    );

    const existing = await this.prisma.attendances.findUnique({
      where: {
        employee_id_work_date: {
          employee_id: dto.employee_id,
          work_date: workDate,
        },
      },
    });
    if (existing?.check_in_time) {
      throw new BadRequestException('Already checked in today');
    }

    const faceResult = this.faceVerificationService.verify(
      employee.face_descriptor,
      dto.face_descriptor,
    );

    let selfieUrl: string | null = null;
    try {
      selfieUrl = await this.uploadSelfieToR2(selfie, employee.full_name);
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload selfie: ${error.message}`,
      );
    }

    const ipAddress = this.deviceInfoService.extract(req);

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
          ? (policy.flexible_start ?? null)
          : null,
        flexible_end: policy?.is_flexible_enabled
          ? (policy.flexible_end ?? null)
          : null,
        check_in_time: timestamp,
        status: AttendanceStatus.pending,
      },
      update: {
        check_in_time: timestamp,
      },
    });

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_in,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: ipAddress.ip_address ?? null,
        user_agent: ipAddress.user_agent ?? null,
        selfie_image_url: selfieUrl,
        similarity_score: faceResult.similarity,
      },
    });

    const late = Math.max(0, checkInMinutes - schedule.start_time);

    await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: { late },
    });

    return ResponseHelper.success(
      {
        ...attendance,
        late,
        face_verified: true,
        similarity_score: faceResult.similarity,
        face_distance: Number(faceResult.comparison.distance.toFixed(6)),
        face_threshold: faceResult.threshold,
      },
      'Checked in successfully with face verification',
    );
  }

  async checkOutWithFace(
    dto: CheckOutDto,
    selfie: Express.Multer.File,
    req: Request,
  ) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = toLocalWorkDate(timestamp);

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
    if (attendance.check_out_time)
      throw new BadRequestException('Already checked out today');

    const employee = await this.prisma.employees.findUnique({
      where: { id: dto.employee_id },
      select: { id: true, full_name: true, face_descriptor: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const faceResult = this.faceVerificationService.verify(
      employee.face_descriptor,
      dto.face_descriptor,
    );

    let selfieUrl: string | null = null;
    try {
      selfieUrl = await this.uploadSelfieToR2(selfie, employee.full_name);
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload selfie: ${error.message}`,
      );
    }

    const deviceInfo = this.deviceInfoService.extract(req);

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_out,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: deviceInfo.ip_address,
        user_agent: deviceInfo.user_agent,
        selfie_image_url: selfieUrl,
        similarity_score: faceResult.similarity,
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
    const overtime = Math.max(0, checkOutMin - attendance.scheduled_end);

    const updated = await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: {
        check_out_time: timestamp,
        work_minutes: workMinutes,
        early_leave: earlyLeave,
        overtime,
      },
    });

    return ResponseHelper.success(
      {
        ...updated,
        face_verified: true,
        similarity_score: faceResult.similarity,
        face_distance: Number(faceResult.comparison.distance.toFixed(6)),
        face_threshold: faceResult.threshold,
      },
      'Checked out successfully',
    );
  }

  async checkIn(dto: CheckInDto, req: Request) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = toLocalWorkDate(timestamp);

    const dayOfWeek = workDate.getDay() === 0 ? 6 : workDate.getDay() - 1;
    const schedule = await this.prisma.employeeWorkSchedules.findFirst({
      where: { employee_id: dto.employee_id, day_of_week: dayOfWeek },
    });
    if (!schedule)
      throw new BadRequestException(
        'No work schedule found for employee today',
      );

    const checkInMinutes = dateToMinutes(timestamp);
    // Temporarily allow check-in after scheduled work hours.
    // if (checkInMinutes > schedule.end_time) {
    //   throw new BadRequestException(
    //     `Check-in not allowed after work hours end (${schedule.end_time} min). Current time: ${checkInMinutes} min.`,
    //   );
    // }

    const policyRes = await this.workPolicyService.getActive(timestamp);
    const policy = policyRes.data;

    this.attendanceValidationService.validateGps(
      policy as WorkPolicies,
      dto.latitude,
      dto.longitude,
    );

    const existing = await this.prisma.attendances.findUnique({
      where: {
        employee_id_work_date: {
          employee_id: dto.employee_id,
          work_date: workDate,
        },
      },
    });
    if (existing?.check_in_time) {
      throw new BadRequestException('Already checked in today');
    }

    const deviceInfo = this.deviceInfoService.extract(req);

    const isFlexibleEnabled = !!policy?.is_flexible_enabled;

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
        flexible_start: isFlexibleEnabled ? policy?.flexible_start : null,
        flexible_end: isFlexibleEnabled ? policy?.flexible_end : null,
        check_in_time: timestamp,
        status: AttendanceStatus.pending,
      },
      update: {
        check_in_time: timestamp,
        flexible_start: isFlexibleEnabled ? policy?.flexible_start : null,
        flexible_end: isFlexibleEnabled ? policy?.flexible_end : null,
      },
    });

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_in,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: deviceInfo.ip_address,
        user_agent: deviceInfo.user_agent,
      },
    });

    const late = Math.max(0, checkInMinutes - schedule.start_time);

    await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: { late },
    });

    return ResponseHelper.success(
      { ...attendance, late },
      'Checked in successfully',
    );
  }

  async checkOut(dto: CheckOutDto, req: Request) {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const workDate = toLocalWorkDate(timestamp);

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
    if (attendance.check_out_time)
      throw new BadRequestException('Already checked out today');

    const deviceInfo = this.deviceInfoService.extract(req);

    await this.prisma.attendanceLogs.create({
      data: {
        attendance_id: attendance.id,
        action: AttendanceAction.check_out,
        timestamp,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        ip_address: deviceInfo.ip_address,
        user_agent: deviceInfo.user_agent,
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
    const overtime = Math.max(0, checkOutMin - attendance.scheduled_end);

    const updated = await this.prisma.attendances.update({
      where: { id: attendance.id },
      data: {
        check_out_time: timestamp,
        work_minutes: workMinutes,
        early_leave: earlyLeave,
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

  async findSummaries(month: number, year: number, departmentId?: string) {
    const deptFilter = departmentId
      ? {
          position: { department_id: departmentId },
          status: EmployeeStatus.active,
        }
      : { status: EmployeeStatus.active };

    const monthRange = getMonthRange(month, year);

    const [attendances, employees, leaveRequests, holidays, pendingLeaves] =
      await this.prisma.$transaction([
        this.prisma.attendances.findMany({
          where: {
            work_date: monthRange,
            ...(departmentId
              ? {
                  employee: {
                    position: { department_id: departmentId },
                    status: EmployeeStatus.active,
                  },
                }
              : { employee: { status: EmployeeStatus.active } }),
          },
          include: {
            employee: {
              include: { position: { include: { department: true } } },
            },
          },
        }),
        this.prisma.employees.findMany({
          where: deptFilter,
          include: { position: { include: { department: true } } },
        }),
        this.prisma.leaveRequests.findMany({
          where: {
            status: LeaveStatus.approved,
            start_date: { lte: monthRange.lte },
            end_date: { gte: monthRange.gte },
            ...(departmentId
              ? {
                  employee: {
                    position: { department_id: departmentId },
                    status: EmployeeStatus.active,
                  },
                }
              : { employee: { status: EmployeeStatus.active } }),
          },
        }),
        this.prisma.holidays.findMany({
          where: { holiday_date: { gte: monthRange.gte, lte: monthRange.lte } },
        }),
        this.prisma.leaveRequests.findMany({
          where: {
            status: LeaveStatus.pending,
            approved_by_admin: null,
            ...(departmentId
              ? {
                  employee: {
                    position: { department_id: departmentId },
                    status: EmployeeStatus.active,
                  },
                }
              : { employee: { status: EmployeeStatus.active } }),
          },
          select: { employee_id: true },
        }),
      ]);

    const holidayDates = new Set(
      holidays.map((h) => {
        const d = h.holiday_date;
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }),
    );
    const holidayCount = holidays.filter((h) => {
      const dow = h.holiday_date.getUTCDay();
      return dow !== 0 && dow !== 6;
    }).length;

    const planDay = getWorkingDaysInMonth(month, year);
    const elapsedWorkDays = getWorkingDaysUpToToday(month, year, holidayDates);
    const summaryMap = new Map<string, any>();

    employees.forEach((emp) => {
      summaryMap.set(emp.id, {
        employee_id: emp.id,
        employee: emp,
        plan_day: planDay,
        actual_day: 0,
        late_minutes: 0,
        absent: 0,
        annual_leave: 0,
        unpaid_leave: 0,
        holiday_days: holidayCount,
        over_time: 0,
        work_minutes: 0,
        pending_leave_count: 0,
      });
    });

    pendingLeaves.forEach(({ employee_id }) => {
      const stats = summaryMap.get(employee_id);
      if (stats) stats.pending_leave_count += 1;
    });

    const todayBoundary = toLocalWorkDate(new Date());
    const todayStr = todayBoundary.toISOString().slice(0, 10);
    const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate().toString().padStart(2, '0')}`;

    attendances.forEach((att) => {
      const stats = summaryMap.get(att.employee_id);
      if (!stats) return;
      const wd =
        att.work_date instanceof Date ? att.work_date : new Date(att.work_date);
      const wdStr = `${wd.getUTCFullYear()}-${String(wd.getUTCMonth() + 1).padStart(2, '0')}-${String(wd.getUTCDate()).padStart(2, '0')}`;
      if (
        att.check_in_time &&
        wdStr < todayStr &&
        wdStr >= monthStartStr &&
        wdStr <= monthEndStr
      ) {
        stats.actual_day += 1;
      }
      if (att.late > 0) stats.late_minutes += att.late;
      stats.over_time += att.overtime ?? 0;
      stats.work_minutes += att.work_minutes ?? 0;
    });

    leaveRequests.forEach((lr) => {
      const stats = summaryMap.get(lr.employee_id);
      if (!stats) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rangeEnd =
        lr.end_date < monthRange.lte ? lr.end_date : monthRange.lte;
      const effectiveEnd =
        rangeEnd < today ? rangeEnd : new Date(today.getTime() - 1);
      const start =
        lr.start_date > monthRange.gte ? lr.start_date : monthRange.gte;
      let days = 0;
      for (
        const d = new Date(start);
        d <= effectiveEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const dow = d.getDay();
        const iso = d.toISOString().slice(0, 10);
        if (dow !== 0 && dow !== 6 && !holidayDates.has(iso)) days++;
      }

      if (lr.leave_type === LeaveType.annual) stats.annual_leave += days;
      else if (lr.leave_type === LeaveType.unpaid) stats.unpaid_leave += days;
    });

    summaryMap.forEach((s) => {
      s.absent = Math.max(
        0,
        elapsedWorkDays - s.actual_day - s.annual_leave - s.unpaid_leave,
      );
    });

    return ResponseHelper.success(Array.from(summaryMap.values()));
  }

  async findByEmployee(employeeId: string, month: number, year: number) {
    const monthRange = getMonthRange(month, year);

    const [records, employee, leaveRequests, holidays] =
      await this.prisma.$transaction([
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
        this.prisma.holidays.findMany({
          where: {
            holiday_date: { gte: monthRange.gte, lte: monthRange.lte },
          },
        }),
      ]);

    if (!employee)
      throw new NotFoundException(`Employee ${employeeId} not found`);

    const work_policy = await this.workPolicyService.getActive(monthRange.gte);
    const annualLeaveBalance = await this.buildAnnualLeaveBalance(
      {
        id: employee.id,
        annual_leave_days: employee.annual_leave_days,
        work_schedules: employee.work_schedules,
      },
      monthRange.lte,
    );

    const planDay = getWorkingDaysInMonth(month, year);
    const actualDay = records.filter((r) => r.check_in_time).length;

    return ResponseHelper.success({
      employee,
      records,
      work_schedules: employee.work_schedules,
      work_policy: work_policy?.data ?? null,
      holidays,
      leave_requests: leaveRequests,
      annual_leave_balance: annualLeaveBalance,
      summary: {
        plan_day: planDay,
        actual_day: actualDay,
        late: records.reduce((s, r) => s + (r.late ?? 0), 0),
        absent: Math.max(0, getWorkingDaysUpToToday(month, year) - actualDay),
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
