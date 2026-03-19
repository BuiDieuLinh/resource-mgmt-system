import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  resolvePagination,
  buildPaginatedResult,
} from 'src/common/utils/pagination.util';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePositionDto) {
    const created = await this.prisma.positions.create({ data: dto });
    return ResponseHelper.success(created, 'Position created successfully');
  }

  async findAll(query: QueryPositionDto) {
    const pagination = resolvePagination(query);
    const { skip, take } = pagination;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { position_name: { contains: query.search, mode: 'insensitive' } },
        { level: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.department_id) {
      where.department_id = query.department_id;
    }

    const [positions, count] = await this.prisma.$transaction([
      this.prisma.positions.findMany({
        where,
        skip,
        take,
        orderBy: { position_name: 'asc' },
        include: { department: true },
      }),
      this.prisma.positions.count({ where }),
    ]);

    return ResponseHelper.success(
      buildPaginatedResult(positions, count, pagination),
    );
  }

  async findOne(id: string) {
    const position = await this.prisma.positions.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });
    if (!position) throw new NotFoundException('Position not found');
    return ResponseHelper.success(position);
  }

  async update(id: string, dto: UpdatePositionDto) {
    await this.findOne(id);
    const updated = await this.prisma.positions.update({
      where: { id },
      data: dto,
    });
    return ResponseHelper.success(updated, 'Position updated successfully');
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.positions.delete({
      where: { id },
    });
    return ResponseHelper.success(deleted, 'Position deleted successfully');
  }
}
