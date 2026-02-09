import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const data = {
      ...dto,
      date_of_birth: dto.date_of_birth && dto.date_of_birth.trim() !== '' 
        ? new Date(dto.date_of_birth)
        : null,
      hire_date: new Date(dto.hire_date),
      gender: dto.gender && dto.gender.trim() !== '' 
        ? dto.gender 
        : null,
    };
    
    const created = await this.prisma.employees.create({ data });
    return ResponseHelper.success(created, 'Employee created successfully');
  }

  async findAll(query: QueryEmployeeDto) {
    const pageIndex = query.pageIndex || 1;
    const pageSize = query.pageSize || 10;
    const skip = (pageIndex - 1) * pageSize;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employee_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.filter) {
      where.status = query.filter;
    }

    const [employees, count] = await this.prisma.$transaction([
      this.prisma.employees.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          department: true,
          position: true,
        },
      }),
      this.prisma.employees.count({ where }),
    ]);

    return ResponseHelper.success({ data: employees, count });
  }

  async findOne(id: string) {
    const position = await this.prisma.employees.findUnique({
      where: { id }
    });
    if (!position) throw new NotFoundException('Position not found');
    return ResponseHelper.success(position);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    
    const data = {
      ...dto,
      date_of_birth: dto.date_of_birth && dto.date_of_birth.trim() !== '' 
        ? new Date(dto.date_of_birth)
        : null,
      hire_date: dto.hire_date ? new Date(dto.hire_date) : undefined,
      gender: dto.gender && dto.gender.trim() !== '' 
        ? dto.gender 
        : null,
    };
    
    const updated = await this.prisma.employees.update({
      where: { id },
      data,
    });
    return ResponseHelper.success(updated, 'Employee updated successfully');
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.employees.delete({ where: { id } });
    return ResponseHelper.success(deleted, 'Employee deleted successfully');
  }
}