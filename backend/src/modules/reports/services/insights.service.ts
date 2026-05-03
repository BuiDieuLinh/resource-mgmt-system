import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AlertInsight } from '../../alerts/dto/alerts.dto';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async getInsights(): Promise<AlertInsight[]> {
    const insights: AlertInsight[] = [];

    const lateKPIInsight = await this.analyzeLateVsKPI();
    if (lateKPIInsight) insights.push(lateKPIInsight);

    const turnoverKPIInsight = await this.analyzeTurnoverVsKPI();
    if (turnoverKPIInsight) insights.push(turnoverKPIInsight);

    const tenureTurnoverInsight = await this.analyzeTenureVsTurnover();
    if (tenureTurnoverInsight) insights.push(tenureTurnoverInsight);

    return insights;
  }

  private async analyzeLateVsKPI(): Promise<AlertInsight | null> {
    const latestCycle = await this.prisma.reviewCycles.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        reviews: {
          where: { status: 'published' },
        },
      },
    });

    if (!latestCycle || latestCycle.reviews.length === 0) return null;

    const frequentLateEmployees = latestCycle.reviews.filter(
      (r) => (r.late_count ?? 0) > 5,
    );
    const normalEmployees = latestCycle.reviews.filter(
      (r) => (r.late_count ?? 0) <= 5,
    );

    if (frequentLateEmployees.length === 0 || normalEmployees.length === 0) {
      return null;
    }

    const avgKPIFrequentLate =
      frequentLateEmployees.reduce((sum, r) => sum + r.total_score!, 0) /
      frequentLateEmployees.length;
    const avgKPINormal =
      normalEmployees.reduce((sum, r) => sum + r.total_score!, 0) /
      normalEmployees.length;

    const kpiDifference = avgKPINormal - avgKPIFrequentLate;
    const percentDifference =
      avgKPINormal > 0 ? (kpiDifference / avgKPINormal) * 100 : 0;

    if (percentDifference >= 10) {
      return {
        type: 'late_kpi_correlation',
        title: 'Tương quan: Đi trễ nhiều → KPI thấp',
        description: `Nhân viên đi trễ > 5 lần/tháng có điểm KPI trung bình thấp hơn ${percentDifference.toFixed(1)}% so với nhóm còn lại (${avgKPIFrequentLate.toFixed(1)} vs ${avgKPINormal.toFixed(1)})`,
        correlation: Math.min(percentDifference / 100, 1),
        affectedEmployees: frequentLateEmployees.length,
        recommendation:
          'Tăng cường giám sát chuyên cần và tư vấn cho nhóm nhân viên đi trễ thường xuyên',
      };
    }

    return null;
  }

  private async analyzeTurnoverVsKPI(): Promise<AlertInsight | null> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const latestCycle = await this.prisma.reviewCycles.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        reviews: {
          where: { status: 'published' },
        },
      },
    });

    if (!latestCycle) return null;

    const departments = await this.prisma.departments.findMany({
      include: {
        positions: {
          include: {
            employees: true,
          },
        },
      },
    });

    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const deptEmployeeIds = dept.positions.flatMap((p) =>
          p.employees.map((e) => e.id),
        );

        if (deptEmployeeIds.length === 0) return null;

        const terminated = await this.prisma.employees.count({
          where: {
            id: { in: deptEmployeeIds },
            status: 'inactive',
            terminated_at: { gte: sixMonthsAgo },
          },
        });

        const activeCount = await this.prisma.employees.count({
          where: {
            id: { in: deptEmployeeIds },
            status: 'active',
          },
        });

        const totalInPeriod = activeCount + terminated;
        const turnoverRate =
          totalInPeriod > 0 ? (terminated / totalInPeriod) * 100 : 0;

        const deptReviews = latestCycle.reviews.filter((r) =>
          deptEmployeeIds.includes(r.employee_id),
        );

        const avgKPI =
          deptReviews.length > 0
            ? deptReviews.reduce((sum, r) => sum + r.total_score!, 0) /
              deptReviews.length
            : 0;

        return {
          departmentName: dept.department_name,
          avgKPI,
          turnoverRate,
          employeeCount: totalInPeriod,
        };
      }),
    );

    const validStats = deptStats.filter((d) => d !== null) as {
      departmentName: string;
      avgKPI: number;
      turnoverRate: number;
      employeeCount: number;
    }[];

    if (validStats.length === 0) return null;

    const highTurnoverLowKPI = validStats.filter(
      (d) => d.turnoverRate > 5 && d.avgKPI < 80,
    );

    if (highTurnoverLowKPI.length > 0) {
      const problemRatio = highTurnoverLowKPI.length / validStats.length;

      const avgKPIProblem =
        highTurnoverLowKPI.reduce((sum, d) => sum + d.avgKPI, 0) /
        highTurnoverLowKPI.length;
      const normalDepts = validStats.filter(
        (d) => d.turnoverRate <= 5 || d.avgKPI >= 80,
      );
      const avgKPINormal =
        normalDepts.length > 0
          ? normalDepts.reduce((sum, d) => sum + d.avgKPI, 0) /
            normalDepts.length
          : 85;

      const kpiGap =
        avgKPINormal > 0
          ? ((avgKPINormal - avgKPIProblem) / avgKPINormal) * 100
          : 0;

      const correlation = Math.min(
        problemRatio * 0.5 + Math.min(kpiGap / 100, 0.5),
        1,
      );

      return {
        type: 'turnover_kpi_correlation',
        title: 'Tương quan: Turnover cao → KPI thấp',
        description: `${highTurnoverLowKPI.length}/${validStats.length} phòng ban có tỷ lệ nghỉ việc cao (>5%) đồng thời có điểm KPI trung bình thấp (<80): ${highTurnoverLowKPI.map((d) => d.departmentName).join(', ')}. KPI trung bình: ${avgKPIProblem.toFixed(1)} vs ${avgKPINormal.toFixed(1)}`,
        correlation: Math.round(correlation * 100) / 100,
        affectedEmployees: highTurnoverLowKPI.reduce(
          (sum, d) => sum + d.employeeCount,
          0,
        ),
        recommendation:
          'Cần điều tra nguyên nhân và cải thiện môi trường làm việc tại các phòng ban này',
      };
    }

    return null;
  }

  private async analyzeTenureVsTurnover(): Promise<AlertInsight | null> {
    const now = new Date();

    const terminatedEmployees = await this.prisma.employees.findMany({
      where: {
        status: 'inactive',
        terminated_at: { not: null },
      },
      select: {
        hire_date: true,
        terminated_at: true,
      },
    });

    if (terminatedEmployees.length === 0) return null;

    const lowTenureCount = terminatedEmployees.filter((emp) => {
      const referenceDate = emp.terminated_at ?? now;
      const tenureMonths = this.calculateTenureMonths(
        emp.hire_date,
        referenceDate,
      );
      return tenureMonths < 12;
    }).length;

    const lowTenurePercent =
      (lowTenureCount / terminatedEmployees.length) * 100;

    if (lowTenurePercent > 50) {
      return {
        type: 'tenure_turnover_correlation',
        title: 'Tương quan: Thâm niên thấp → Turnover cao',
        description: `${lowTenurePercent.toFixed(1)}% nhân viên nghỉ việc có thâm niên < 1 năm (${lowTenureCount}/${terminatedEmployees.length} người)`,
        correlation: Math.min(lowTenurePercent / 100, 1),
        affectedEmployees: lowTenureCount,
        recommendation:
          'Cải thiện quy trình onboarding và chương trình đào tạo cho nhân viên mới để giảm tỷ lệ nghỉ việc sớm',
      };
    }

    return null;
  }

  private calculateTenureMonths(hireDate: Date, referenceDate: Date): number {
    const years = referenceDate.getFullYear() - hireDate.getFullYear();
    const months = referenceDate.getMonth() - hireDate.getMonth();
    return years * 12 + months;
  }
}
