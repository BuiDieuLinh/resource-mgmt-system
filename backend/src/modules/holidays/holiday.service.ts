import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  CreateHolidayDto,
  UpdateHolidayDto,
  QueryHolidayDto,
} from './dto/holiday.dto';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryHolidayDto) {
    const where: any = {};
    if (query.year) {
      const y = parseInt(query.year);
      where.holiday_date = {
        gte: new Date(`${y}-01-01`),
        lte: new Date(`${y}-12-31`),
      };
    }
    const holidays = await this.prisma.holidays.findMany({
      where,
      orderBy: { holiday_date: 'asc' },
    });
    return ResponseHelper.success(holidays);
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holidays.findUnique({ where: { id } });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    return ResponseHelper.success(holiday);
  }

  async create(dto: CreateHolidayDto) {
    const existing = await this.prisma.holidays.findFirst({
      where: { holiday_date: new Date(dto.holiday_date) },
    });
    if (existing)
      throw new BadRequestException(
        `A holiday already exists on ${dto.holiday_date}`,
      );

    const created = await this.prisma.holidays.create({
      data: {
        name: dto.name,
        holiday_date: new Date(dto.holiday_date),
        description: dto.description ?? null,
        is_paid: dto.is_paid ?? true,
      },
    });
    return ResponseHelper.success(created, 'Holiday created');
  }

  async update(id: string, dto: UpdateHolidayDto) {
    const existing = await this.prisma.holidays.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Holiday ${id} not found`);

    if (dto.holiday_date) {
      const conflict = await this.prisma.holidays.findFirst({
        where: { holiday_date: new Date(dto.holiday_date), NOT: { id } },
      });
      if (conflict)
        throw new BadRequestException(
          `A holiday already exists on ${dto.holiday_date}`,
        );
    }

    const updated = await this.prisma.holidays.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.holiday_date && { holiday_date: new Date(dto.holiday_date) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.is_paid !== undefined && { is_paid: dto.is_paid }),
      },
    });
    return ResponseHelper.success(updated, 'Holiday updated');
  }

  async remove(id: string) {
    const existing = await this.prisma.holidays.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Holiday ${id} not found`);
    await this.prisma.holidays.delete({ where: { id } });
    return ResponseHelper.success(null, 'Holiday deleted');
  }

  async getHolidayDateSet(year?: number): Promise<Set<string>> {
    const where: any = {};
    if (year) {
      where.holiday_date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }
    const holidays = await this.prisma.holidays.findMany({
      where,
      select: { holiday_date: true },
    });
    return new Set(
      holidays.map((h) => h.holiday_date.toISOString().slice(0, 10)),
    );
  }
}
