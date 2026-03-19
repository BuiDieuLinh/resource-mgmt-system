import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkScheduleDto } from './dto/work-schedule.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';

const toTime = (hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(1970, 0, 1, h, m, 0);
};

@Injectable()
export class WorkScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async setSchedule(employeeId: string, dto: WorkScheduleDto) {
    await this.prisma.employeeWorkSchedules.deleteMany({
      where: { employee_id: employeeId },
    });
    const created = await this.prisma.employeeWorkSchedules.create({
      data: {
        employee_id: employeeId,
        day_of_week: dto.working_days,
        start_time: toTime(dto.start_time),
        end_time: toTime(dto.end_time),
      },
    });
    return ResponseHelper.success(created);
  }

  async findByEmployee(employeeId: string) {
    const schedule = await this.prisma.employeeWorkSchedules.findFirst({
      where: { employee_id: employeeId },
    });
    return ResponseHelper.success(schedule);
  }

  async removeByEmployee(employeeId: string) {
    await this.prisma.employeeWorkSchedules.deleteMany({
      where: { employee_id: employeeId },
    });
  }
}
