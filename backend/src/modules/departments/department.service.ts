import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  resolvePagination,
  buildPaginatedResult,
} from 'src/common/utils/pagination.util';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const created = await this.prisma.departments.create({ data: dto });
    return ResponseHelper.success(created, 'Department created successfully');
  }

  async findAll(query: QueryDepartmentDto) {
    const pagination = resolvePagination(query);
    const { skip, take } = pagination;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { department_name: { contains: query.search, mode: 'insensitive' } },
        { department_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [departments, count] = await this.prisma.$transaction([
      this.prisma.departments.findMany({
        where,
        skip,
        take,
        orderBy: { department_name: 'asc' },
      }),
      this.prisma.departments.count({ where }),
    ]);

    return ResponseHelper.success(
      buildPaginatedResult(departments, count, pagination),
    );
  }

  async findOne(id: string) {
    const department = await this.prisma.departments.findUnique({
      where: { id },
    });
    if (!department) throw new NotFoundException('Department not found');
    return ResponseHelper.success(department);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    const updated = await this.prisma.departments.update({
      where: { id },
      data: dto,
    });
    return ResponseHelper.success(updated, 'Department updated successfully');
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.departments.delete({
      where: { id },
    });
    return ResponseHelper.success(deleted, 'Department deleted successfully');
  }
}
