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
import * as ExcelJS from 'exceljs';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const data = {
      ...dto,
      date_of_birth:
        dto.date_of_birth && dto.date_of_birth.trim() !== ''
          ? new Date(dto.date_of_birth)
          : null,
      hire_date: new Date(dto.hire_date),
      gender: dto.gender && dto.gender.trim() !== '' ? dto.gender : null,
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
      where: { id },
    });
    if (!position) throw new NotFoundException('Position not found');
    return ResponseHelper.success(position);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const data = {
      ...dto,
      date_of_birth:
        dto.date_of_birth && dto.date_of_birth.trim() !== ''
          ? new Date(dto.date_of_birth)
          : null,
      hire_date: dto.hire_date ? new Date(dto.hire_date) : undefined,
      gender: dto.gender && dto.gender.trim() !== '' ? dto.gender : null,
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

  async exportToExcel(): Promise<any> {
    const employees = await this.prisma.employees.findMany({
      include: {
        department: true,
        position: true,
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
        department: emp.department.department_name,
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

      const worksheet = workbook.getWorksheet('Employees');
      if (!worksheet) {
        throw new BadRequestException('Worksheet "Employees" not found');
      }

      const employees: any[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const employeeData = {
          employee_code: row.getCell(1).value?.toString() || '',
          full_name: row.getCell(2).value?.toString() || '',
          display_name: row.getCell(3).value?.toString() || '',
          email: row.getCell(4).value?.toString() || '',
          phone: row.getCell(5).value?.toString() || '',
          identify_card: row.getCell(6).value?.toString() || '',
          gender: row.getCell(7).value?.toString() || '',
          date_of_birth: row.getCell(8).value?.toString() || '',
          hire_date: row.getCell(9).value?.toString() || '',
          department_name: row.getCell(10).value?.toString() || '',
          position_name: row.getCell(11).value?.toString() || '',
          status: row.getCell(12).value?.toString() || 'active',
        };

        employees.push(employeeData);
      });

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
        const department = await this.prisma.departments.findFirst({
          where: { department_name: empData.department_name },
        });

        const position = await this.prisma.positions.findFirst({
          where: { position_name: empData.position_name },
        });

        if (!department || !position) {
          failed.push({
            employee_code: empData.employee_code,
            reason: 'Department or Position not found',
          });
          continue;
        }

        await this.prisma.employees.create({
          data: {
            employee_code: empData.employee_code,
            full_name: empData.full_name,
            display_name: empData.display_name || null,
            email: empData.email,
            phone: empData.phone || null,
            identify_card: empData.identify_card,
            gender: empData.gender || null,
            date_of_birth: empData.date_of_birth
              ? new Date(empData.date_of_birth)
              : null,
            hire_date: empData.hire_date
              ? new Date(empData.hire_date)
              : new Date(),
            department_id: department.id,
            position_id: position.id,
            status: empData.status as any,
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
