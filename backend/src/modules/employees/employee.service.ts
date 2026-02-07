import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const created = await this.prisma.client.employees.create({ data: dto });
    return ResponseHelper.success(created, 'Employee created successfully');
  }

  async findAll(query?: {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    filter?: string;
  }) {
    const pageIndex = query?.pageIndex || 1;
    const pageSize = query?.pageSize || 10;
    const skip = (pageIndex - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employee_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.filter) {
      where.status = query.filter;
    }

    const [employees, count] = await this.prisma.client.$transaction([
      this.prisma.client.employees.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          department: true,
          position: true,
        },
      }),
      this.prisma.client.employees.count({ where }),
    ]);

    return ResponseHelper.success({ data: employees, count });
  }

  async findOne(id: string) {
    const position = await this.prisma.client.employees.findUnique({
      where: { id }
    });
    if (!position) throw new NotFoundException('Position not found');
    return ResponseHelper.success(position);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    const updated = await this.prisma.client.employees.update({
      where: { id },
      data: dto,
    });
    return ResponseHelper.success(updated, 'Employee updated successfully');
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.client.employees.delete({ where: { id } });
    return ResponseHelper.success(deleted, 'Employee deleted successfully');
  }
}