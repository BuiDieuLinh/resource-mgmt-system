import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  HrStructureQueryDto,
  HrStructureResponse,
  TurnoverQueryDto,
  TurnoverResponse,
  ReportPeriod,
} from '../dto/hr-reports.dto';

@Injectable()
export class HrReportsService {
  constructor(private prisma: PrismaService) {}

  async getHrStructure(
    query: HrStructureQueryDto,
  ): Promise<HrStructureResponse> {
    const now = new Date();
    const referenceDate = query.endDate ? new Date(query.endDate) : now;

    const employees = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        hire_date: {
          lte: referenceDate,
        },
      },
      include: {
        position: {
          include: {
            department: true,
          },
        },
      },
    });

    const totalEmployees = employees.length;

    const departmentMap = new Map<string, { name: string; count: number }>();
    employees.forEach((emp) => {
      const deptId = emp.position.department.id;
      const deptName = emp.position.department.department_name;
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, { name: deptName, count: 0 });
      }
      departmentMap.get(deptId)!.count++;
    });

    const byDepartment = Array.from(departmentMap.entries()).map(
      ([id, data]) => ({
        departmentId: id,
        departmentName: data.name,
        employeeCount: data.count,
        percentage: (data.count / totalEmployees) * 100,
      }),
    );

    const ageGroups = { '<25': 0, '25-35': 0, '35-45': 0, '>45': 0 };
    employees.forEach((emp) => {
      const age = this.calculateAge(emp.date_of_birth, referenceDate);
      if (age < 25) ageGroups['<25']++;
      else if (age <= 35) ageGroups['25-35']++;
      else if (age <= 45) ageGroups['35-45']++;
      else ageGroups['>45']++;
    });

    const byAge = Object.entries(ageGroups).map(([group, count]) => ({
      ageGroup: group,
      employeeCount: count,
      percentage: (count / totalEmployees) * 100,
    }));

    const genderMap = new Map<string, number>();
    employees.forEach((emp) => {
      const gender = emp.gender;
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });

    const byGender = Array.from(genderMap.entries()).map(([gender, count]) => ({
      gender,
      employeeCount: count,
      percentage: (count / totalEmployees) * 100,
    }));

    const tenureGroups = {
      '<1 năm': 0,
      '1-3 năm': 0,
      '3-5 năm': 0,
      '>5 năm': 0,
    };
    employees.forEach((emp) => {
      const tenureMonths = this.calculateTenureMonths(
        emp.hire_date,
        referenceDate,
      );
      const tenureYears = tenureMonths / 12;
      if (tenureYears < 1) tenureGroups['<1 năm']++;
      else if (tenureYears <= 3) tenureGroups['1-3 năm']++;
      else if (tenureYears <= 5) tenureGroups['3-5 năm']++;
      else tenureGroups['>5 năm']++;
    });

    const byTenure = Object.entries(tenureGroups).map(([group, count]) => ({
      tenureGroup: group,
      employeeCount: count,
      percentage: (count / totalEmployees) * 100,
    }));

    const contractMap = new Map<string, number>();
    employees.forEach((emp) => {
      const level = emp.position.level;
      let contractType = 'Full-time';
      if (level === 'junior') {
        contractType = 'Thử việc';
      }
      contractMap.set(contractType, (contractMap.get(contractType) || 0) + 1);
    });

    const byContract = Array.from(contractMap.entries()).map(
      ([type, count]) => ({
        contractType: type,
        employeeCount: count,
        percentage: (count / totalEmployees) * 100,
      }),
    );

    return {
      totalEmployees,
      byDepartment,
      byAge,
      byGender,
      byTenure,
      byContract,
    };
  }

  async getTurnoverReport(query: TurnoverQueryDto): Promise<TurnoverResponse> {
    const period = query.period || ReportPeriod.MONTH;
    const year = query.year || new Date().getFullYear();

    let periods: { start: Date; end: Date; label: string }[] = [];

    if (period === ReportPeriod.MONTH) {
      for (let month = 1; month <= 12; month++) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        periods.push({
          start,
          end,
          label: `${year}-${String(month).padStart(2, '0')}`,
        });
      }
    } else if (period === ReportPeriod.QUARTER) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const startMonth = (quarter - 1) * 3;
        const start = new Date(year, startMonth, 1);
        const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
        periods.push({
          start,
          end,
          label: `${year}-Q${quarter}`,
        });
      }
    } else {
      for (let y = year - 4; y <= year; y++) {
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31, 23, 59, 59);
        periods.push({
          start,
          end,
          label: `${y}`,
        });
      }
    }

    const data = await Promise.all(
      periods.map(async (p) => {
        const newHires = await this.prisma.employees.count({
          where: {
            hire_date: {
              gte: p.start,
              lte: p.end,
            },
          },
        });

        const terminations = await this.prisma.employees.count({
          where: {
            status: 'inactive',
            terminated_at: {
              gte: p.start,
              lte: p.end,
            },
          },
        });

        const employeesAtStart = await this.prisma.employees.count({
          where: {
            hire_date: {
              lt: p.start,
            },
            OR: [
              { status: 'active' },
              {
                status: 'inactive',
                terminated_at: { gte: p.start },
              },
            ],
          },
        });

        const employeesAtEnd = await this.prisma.employees.count({
          where: {
            hire_date: {
              lte: p.end,
            },
            status: 'active',
          },
        });

        const averageEmployees = (employeesAtStart + employeesAtEnd) / 2;
        const turnoverRate =
          averageEmployees > 0 ? (terminations / averageEmployees) * 100 : 0;
        const retentionRate = 100 - turnoverRate;

        return {
          period: p.label,
          newHires,
          terminations,
          averageEmployees: Math.round(averageEmployees),
          turnoverRate: Math.round(turnoverRate * 100) / 100,
          retentionRate: Math.round(retentionRate * 100) / 100,
        };
      }),
    );

    const activeEmployees = await this.prisma.employees.findMany({
      where: { status: 'active' },
      select: { hire_date: true },
    });

    const totalTenureMonths = activeEmployees.reduce((sum, emp) => {
      return sum + this.calculateTenureMonths(emp.hire_date, new Date());
    }, 0);

    const averageTenureMonths =
      activeEmployees.length > 0
        ? Math.round(totalTenureMonths / activeEmployees.length)
        : 0;

    const summary = {
      totalNewHires: data.reduce((sum, d) => sum + d.newHires, 0),
      totalTerminations: data.reduce((sum, d) => sum + d.terminations, 0),
      averageTurnoverRate:
        Math.round(
          (data.reduce((sum, d) => sum + d.turnoverRate, 0) / data.length) *
            100,
        ) / 100,
      averageRetentionRate:
        Math.round(
          (data.reduce((sum, d) => sum + d.retentionRate, 0) / data.length) *
            100,
        ) / 100,
      averageTenureMonths,
    };

    return {
      period: period,
      data,
      summary,
    };
  }

  private calculateAge(birthDate: Date, referenceDate: Date): number {
    const age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
  }

  private calculateTenureMonths(hireDate: Date, referenceDate: Date): number {
    const years = referenceDate.getFullYear() - hireDate.getFullYear();
    const months = referenceDate.getMonth() - hireDate.getMonth();
    return years * 12 + months;
  }
}
