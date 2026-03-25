import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import {
  resolvePagination,
  buildPaginatedResult,
} from 'src/common/utils/pagination.util';
import * as ExcelJS from 'exceljs';
import {
  getCellValue,
  parseDate,
  validateHeaders,
} from 'src/modules/employees/utils/excel.util';
import { WorkScheduleService } from 'src/modules/work-schedules/work-schedule.service';
import { WorkScheduleDto } from 'src/modules/work-schedules/dto/work-schedule.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workScheduleService: WorkScheduleService,
  ) {}

  async checkExists(
    field: 'employee_code' | 'email' | 'identify_card',
    value: string,
    excludeId?: string,
  ) {
    if (!value?.trim()) return ResponseHelper.success({ exists: false });

    const where: any = { [field]: value };
    if (excludeId) where.NOT = { id: excludeId };

    const found = await this.prisma.employees.findFirst({ where });
    return ResponseHelper.success({ exists: !!found });
  }

  async create(dto: CreateEmployeeDto) {
    const [existingCode, existingEmail, existingCard] =
      await this.prisma.$transaction([
        this.prisma.employees.findFirst({
          where: { employee_code: dto.employee_code },
        }),
        this.prisma.employees.findFirst({ where: { email: dto.email } }),
        this.prisma.employees.findFirst({
          where: { identify_card: dto.identify_card },
        }),
      ]);

    if (existingCode)
      throw new BadRequestException(
        `Employee code "${dto.employee_code}" already exists`,
      );
    if (existingEmail)
      throw new BadRequestException(`Email "${dto.email}" is already in use`);
    if (existingCard)
      throw new BadRequestException(
        `Identity card "${dto.identify_card}" already exists`,
      );

    const { date_of_birth, hire_date, gender, work_schedules, ...rest } = dto;
    const schedules: WorkScheduleDto[] = Array.isArray(work_schedules)
      ? work_schedules
      : [];

    const data = {
      ...rest,
      hire_date: new Date(hire_date),
      date_of_birth: new Date(date_of_birth),
      gender: gender?.trim(),
    };

    const created = await this.prisma.employees.create({ data });

    if (schedules.length) {
      await this.workScheduleService.setSchedule(created.id, schedules);
    }

    return ResponseHelper.success(created, 'Employee created successfully');
  }

  async findAll(query: QueryEmployeeDto) {
    const pagination = resolvePagination(query);
    const { skip, take } = pagination;

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
        take,
        orderBy: { created_at: 'desc' },
        include: {
          position: {
            include: {
              department: true,
            },
          },
          work_schedules: true,
        },
      }),
      this.prisma.employees.count({ where }),
    ]);

    return ResponseHelper.success(
      buildPaginatedResult(employees, count, pagination),
    );
  }

  async findOne(id: string) {
    const position = await this.prisma.employees.findUnique({
      where: { id },
      include: {
        position: {
          include: {
            department: true,
          },
        },
        work_schedules: true,
      },
    });
    if (!position) throw new NotFoundException('Position not found');
    return ResponseHelper.success(position);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employees.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    const checks: Promise<any>[] = [];
    const checkKeys: string[] = [];

    if (dto.employee_code && dto.employee_code !== existing.employee_code) {
      checks.push(
        this.prisma.employees.findFirst({
          where: { employee_code: dto.employee_code, NOT: { id } },
        }),
      );
      checkKeys.push('employee_code');
    }
    if (dto.email && dto.email !== existing.email) {
      checks.push(
        this.prisma.employees.findFirst({
          where: { email: dto.email, NOT: { id } },
        }),
      );
      checkKeys.push('email');
    }
    if (dto.identify_card && dto.identify_card !== existing.identify_card) {
      checks.push(
        this.prisma.employees.findFirst({
          where: { identify_card: dto.identify_card, NOT: { id } },
        }),
      );
      checkKeys.push('identify_card');
    }
    if (dto.position_id) {
      checks.push(
        this.prisma.positions.findUnique({ where: { id: dto.position_id } }),
      );
      checkKeys.push('position_id');
    }

    if (checks.length > 0) {
      const results = await Promise.all(checks);
      results.forEach((result, i) => {
        const key = checkKeys[i];
        if (key === 'position_id' && !result)
          throw new BadRequestException(
            `Position with id "${dto.position_id}" not found`,
          );
        if (key === 'employee_code' && result)
          throw new BadRequestException(
            `Employee code "${dto.employee_code}" already exists`,
          );
        if (key === 'email' && result)
          throw new BadRequestException(
            `Email "${dto.email}" is already in use`,
          );
        if (key === 'identify_card' && result)
          throw new BadRequestException(
            `Identity card "${dto.identify_card}" already exists`,
          );
      });
    }

    const { date_of_birth, hire_date, gender, work_schedules, ...rest } = dto;
    const schedules: WorkScheduleDto[] = Array.isArray(work_schedules)
      ? work_schedules
      : [];

    const data = {
      ...rest,
      ...(hire_date ? { hire_date: new Date(hire_date) } : {}),
      ...(date_of_birth ? { date_of_birth: new Date(date_of_birth) } : {}),
      ...(gender !== undefined ? { gender: gender?.trim() || undefined } : {}),
    };

    const updated = await this.prisma.employees.update({ where: { id }, data });

    if (schedules.length) {
      await this.workScheduleService.setSchedule(id, schedules);
    }

    return ResponseHelper.success(updated, 'Employee updated successfully');
  }

  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.employees.delete({ where: { id } });
    return ResponseHelper.success(deleted, 'Employee deleted successfully');
  }

  async exportToExcel(): Promise<any> {
    const employees = await this.prisma.employees.findMany({
      include: {
        position: {
          include: {
            department: true,
          },
        },
        work_schedules: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    worksheet.columns = [
      { header: 'Employee Code', key: 'employee_code', width: 15 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Display Name', key: 'display_name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Identity Card', key: 'identify_card', width: 18 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'date_of_birth', width: 15 },
      { header: 'Hire Date', key: 'hire_date', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4a148c' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    employees.forEach((emp) => {
      worksheet.addRow({
        employee_code: emp.employee_code,
        full_name: emp.full_name,
        display_name: emp.display_name || '',
        email: emp.email,
        phone: emp.phone || '',
        identify_card: emp.identify_card,
        gender: emp.gender || '',
        date_of_birth: emp.date_of_birth
          ? new Date(emp.date_of_birth).toLocaleDateString()
          : '',
        hire_date: new Date(emp.hire_date).toLocaleDateString(),
        department: emp.position.department.department_name,
        position: emp.position.position_name,
        status: emp.status,
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  async previewImport(buffer: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No worksheet found in the Excel file');
      }

      const requiredHeaders = [
        'Employee Code',
        'Full Name',
        'Email',
        'Identify Card',
        'Department',
        'Position',
      ];

      const validation = validateHeaders(worksheet, requiredHeaders);

      if (!validation.valid) {
        throw new BadRequestException(
          `Missing required columns: ${validation.missing.join(', ')}. Found columns: ${validation.found.join(', ')}`,
        );
      }

      const employees: any[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const employeeData = {
          employee_code: getCellValue(row.getCell(1)),
          full_name: getCellValue(row.getCell(2)),
          display_name: getCellValue(row.getCell(3)),
          email: getCellValue(row.getCell(4)),
          phone: getCellValue(row.getCell(5)),
          identify_card: getCellValue(row.getCell(6)),
          gender: getCellValue(row.getCell(7)),
          date_of_birth: getCellValue(row.getCell(8)),
          hire_date: getCellValue(row.getCell(9)),
          department_name: getCellValue(row.getCell(10)),
          position_name: getCellValue(row.getCell(11)),
        };

        // Only add if has required data
        if (
          employeeData.employee_code &&
          employeeData.full_name &&
          employeeData.email
        ) {
          employees.push(employeeData);
        }
      });

      if (employees.length === 0) {
        throw new BadRequestException(
          'No valid employee data found in the file',
        );
      }

      return ResponseHelper.success(employees, 'Preview loaded successfully');
    } catch (error) {
      throw new BadRequestException(`Preview failed: ${error.message}`);
    }
  }

  async importFromExcel(employeesData: any[]) {
    const imported: string[] = [];
    const failed: Array<{ employee_code: string; reason: string }> = [];

    for (const empData of employeesData) {
      try {
        const position = await this.prisma.positions.findFirst({
          where: { position_name: empData.position_name },
        });

        if (!position) {
          failed.push({
            employee_code: empData.employee_code,
            reason: 'Position not found',
          });
          continue;
        }

        const dateOfBirth = parseDate(empData.date_of_birth);
        const hireDate = parseDate(empData.hire_date) || new Date();

        await this.prisma.employees.create({
          data: {
            employee_code: empData.employee_code,
            full_name: empData.full_name,
            display_name: empData.display_name || undefined,
            email: empData.email,
            phone: empData.phone || '',
            identify_card: empData.identify_card,
            gender: empData.gender || '',
            address: empData.address || '',
            date_of_birth: dateOfBirth,
            hire_date: hireDate,
            position_id: position.id,
          },
        });

        imported.push(empData.employee_code);
      } catch (error) {
        failed.push({
          employee_code: empData.employee_code,
          reason: error.message,
        });
      }
    }

    return ResponseHelper.success(
      {
        imported: imported.length,
        failed: failed.length,
        details: { imported, failed },
      },
      'Import completed',
    );
  }
}
