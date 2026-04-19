import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // ── 1. Headcount snapshot per month (cumulative hires by hire_date) ──
    const allEmployees = await this.prisma.employees.findMany({
      select: {
        id: true,
        hire_date: true,
        status: true,
        created_at: true,
        position: {
          select: {
            department: { select: { id: true, department_name: true } },
          },
        },
      },
    });

    const headcountByMonth = Array.from({ length: 12 }, (_, i) => {
      const monthEnd = new Date(year, i + 1, 0, 23, 59, 59); // last day of month
      const active = allEmployees.filter(
        (e) => new Date(e.hire_date) <= monthEnd && e.status === 'active',
      ).length;
      const newHires = allEmployees.filter((e) => {
        const d = new Date(e.hire_date);
        return d.getFullYear() === year && d.getMonth() === i;
      }).length;
      return {
        month: i + 1,
        label: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
        headcount: active,
        new_hires: newHires,
      };
    });

    // ── 2. Department breakdown with level distribution ──
    const deptMap = new Map<
      string,
      {
        name: string;
        levels: Record<string, number>;
        total: number;
        active: number;
      }
    >();
    allEmployees.forEach((e) => {
      const dept = e.position?.department;
      if (!dept) return;
      if (!deptMap.has(dept.id))
        deptMap.set(dept.id, {
          name: dept.department_name,
          levels: {},
          total: 0,
          active: 0,
        });
      const entry = deptMap.get(dept.id)!;
      entry.total++;
      if (e.status === 'active') entry.active++;
    });

    // get level distribution per dept
    const empWithLevel = await this.prisma.employees.findMany({
      select: {
        status: true,
        position: {
          select: { level: true, department: { select: { id: true } } },
        },
      },
    });
    empWithLevel.forEach((e) => {
      const deptId = e.position?.department?.id;
      const level = e.position?.level;
      if (!deptId || !level) return;
      const entry = deptMap.get(deptId);
      if (!entry) return;
      entry.levels[level] = (entry.levels[level] ?? 0) + 1;
    });

    const departmentBreakdown = Array.from(deptMap.entries()).map(
      ([id, d]) => ({
        id,
        name: d.name,
        total: d.total,
        active: d.active,
        inactive: d.total - d.active,
        levels: d.levels,
      }),
    );

    // ── 3. Attendance trend per month (avg rate, late rate, overtime) ──
    const attendanceByMonth = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const monthStart = new Date(year, i, 1);
        const monthEnd = new Date(year, i + 1, 0);
        const records = await this.prisma.attendances.findMany({
          where: { work_date: { gte: monthStart, lte: monthEnd } },
          select: {
            status: true,
            late: true,
            overtime: true,
            work_minutes: true,
          },
        });
        const total = records.length;
        const approved = records.filter((r) => r.status === 'approved').length;
        const lateCount = records.filter((r) => r.late > 0).length;
        const totalOvertimeH = Math.round(
          records.reduce((s, r) => s + r.overtime, 0) / 60,
        );
        const avgWorkH =
          total > 0
            ? Math.round(
                (records.reduce((s, r) => s + r.work_minutes, 0) / total / 60) *
                  10,
              ) / 10
            : 0;
        return {
          month: i + 1,
          label: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
          attendance_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
          late_rate: total > 0 ? Math.round((lateCount / total) * 100) : 0,
          overtime_hours: totalOvertimeH,
          avg_work_hours: avgWorkH,
          total_records: total,
        };
      }),
    );

    // ── 4. Leave request trend per month ──
    const leaveByMonth = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const monthStart = new Date(year, i, 1);
        const monthEnd = new Date(year, i + 1, 0);
        const leaves = await this.prisma.leaveRequests.findMany({
          where: { created_at: { gte: monthStart, lte: monthEnd } },
          select: { leave_type: true, status: true },
        });
        const byType = leaves.reduce<Record<string, number>>((acc, l) => {
          acc[l.leave_type] = (acc[l.leave_type] ?? 0) + 1;
          return acc;
        }, {});
        return {
          month: i + 1,
          label: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
          total: leaves.length,
          approved: leaves.filter((l) => l.status === 'approved').length,
          pending: leaves.filter((l) => l.status === 'pending').length,
          rejected: leaves.filter((l) => l.status === 'rejected').length,
          ...byType,
        };
      }),
    );

    // ── 5. Quarterly summary ──
    const quarters = [
      { label: 'Q1', months: [1, 2, 3] },
      { label: 'Q2', months: [4, 5, 6] },
      { label: 'Q3', months: [7, 8, 9] },
      { label: 'Q4', months: [10, 11, 12] },
    ];
    const quarterlyAttendance = quarters.map((q) => {
      const monthData = attendanceByMonth.filter((m) =>
        q.months.includes(m.month),
      );
      const avgRate =
        monthData.length > 0
          ? Math.round(
              monthData.reduce((s, m) => s + m.attendance_rate, 0) /
                monthData.length,
            )
          : 0;
      const totalOT = monthData.reduce((s, m) => s + m.overtime_hours, 0);
      const totalLeave = leaveByMonth
        .filter((m) => q.months.includes(m.month))
        .reduce((s, m) => s + m.total, 0);
      return {
        quarter: q.label,
        attendance_rate: avgRate,
        overtime_hours: totalOT,
        leave_requests: totalLeave,
      };
    });

    // ── 6. Top metrics ──
    const totalActive = allEmployees.filter(
      (e) => e.status === 'active',
    ).length;
    const totalInactive = allEmployees.filter(
      (e) => e.status === 'inactive',
    ).length;
    const newHiresThisYear = allEmployees.filter(
      (e) => new Date(e.hire_date).getFullYear() === year,
    ).length;

    return ResponseHelper.success({
      year,
      summary: {
        total_employees: allEmployees.length,
        active: totalActive,
        inactive: totalInactive,
        new_hires_this_year: newHiresThisYear,
        departments: deptMap.size,
      },
      headcount_by_month: headcountByMonth,
      department_breakdown: departmentBreakdown,
      attendance_by_month: attendanceByMonth,
      leave_by_month: leaveByMonth,
      quarterly_summary: quarterlyAttendance,
    });
  }
}
