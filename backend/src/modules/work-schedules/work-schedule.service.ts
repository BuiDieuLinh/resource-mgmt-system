import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkScheduleDto } from './dto/work-schedule.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';

@Injectable()
export class WorkScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async setSchedule(employeeId: string, schedules: WorkScheduleDto[]) {
    await this.prisma.employeeWorkSchedules.deleteMany({
      where: { employee_id: employeeId },
    });

    if (schedules.length === 0) {
      return ResponseHelper.success([]);
    }

    await this.prisma.employeeWorkSchedules.createMany({
      data: schedules.map((s) => ({
        employee_id: employeeId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });

    const created = await this.prisma.employeeWorkSchedules.findMany({
      where: { employee_id: employeeId },
      orderBy: { day_of_week: 'asc' },
    });

    return ResponseHelper.success(created);
  }

  async findByEmployee(employeeId: string) {
    const schedules = await this.prisma.employeeWorkSchedules.findMany({
      where: { employee_id: employeeId },
      orderBy: { day_of_week: 'asc' },
    });
    return ResponseHelper.success(schedules);
  }

  async removeByEmployee(employeeId: string) {
    await this.prisma.employeeWorkSchedules.deleteMany({
      where: { employee_id: employeeId },
    });
  }
}
