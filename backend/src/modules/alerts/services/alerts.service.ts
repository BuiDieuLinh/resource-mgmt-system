import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertData,
  AlertQueryDto,
} from '../dto/alerts.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  async createAlert(data: Omit<AlertData, 'id' | 'createdAt'>): Promise<void> {
    this.logger.log(`Creating alert: ${data.type} - ${data.title}`);

    console.log('Alert created:', {
      ...data,
      createdAt: new Date(),
    });

    for (const userId of data.targetUsers) {
      await this.createNotification(userId, data);
    }
  }

  async getAlerts(query: AlertQueryDto): Promise<AlertData[]> {
    return [];
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    this.logger.log(`Alert ${alertId} acknowledged by ${userId}`);
    // Update alert status
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    this.logger.log(`Alert ${alertId} resolved by ${userId}`);
  }

  async checkLateSpikeAlert(departmentId?: string): Promise<void> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthLate = await this.prisma.attendances.count({
      where: {
        work_date: { gte: currentMonth },
        late: { gt: 5 },
        ...(departmentId && {
          employee: {
            position: {
              department_id: departmentId,
            },
          },
        }),
      },
    });

    const currentMonthTotal = await this.prisma.attendances.count({
      where: {
        work_date: { gte: currentMonth },
        ...(departmentId && {
          employee: {
            position: {
              department_id: departmentId,
            },
          },
        }),
      },
    });

    const lastMonthLate = await this.prisma.attendances.count({
      where: {
        work_date: { gte: lastMonth, lte: lastMonthEnd },
        late: { gt: 5 },
        ...(departmentId && {
          employee: {
            position: {
              department_id: departmentId,
            },
          },
        }),
      },
    });

    const lastMonthTotal = await this.prisma.attendances.count({
      where: {
        work_date: { gte: lastMonth, lte: lastMonthEnd },
        ...(departmentId && {
          employee: {
            position: {
              department_id: departmentId,
            },
          },
        }),
      },
    });

    const currentRate =
      currentMonthTotal > 0 ? (currentMonthLate / currentMonthTotal) * 100 : 0;
    const lastRate =
      lastMonthTotal > 0 ? (lastMonthLate / lastMonthTotal) * 100 : 0;

    const increasePercent =
      lastRate > 0 ? ((currentRate - lastRate) / lastRate) * 100 : 0;
    if (increasePercent > 30) {
      const managers = await this.getManagersByDepartment(departmentId);

      await this.createAlert({
        type: AlertType.LATE_SPIKE,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.ACTIVE,
        title: 'Tỷ lệ đi trễ tăng đột biến',
        message: `Tỷ lệ đi trễ tháng này (${currentRate.toFixed(1)}%) tăng ${increasePercent.toFixed(1)}% so với tháng trước (${lastRate.toFixed(1)}%)`,
        metadata: {
          currentRate,
          lastRate,
          increasePercent,
          departmentId,
        },
        targetUsers: managers,
      });
    }
  }

  async checkHighTurnoverAlert(): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const terminations = await this.prisma.employees.count({
      where: {
        status: 'inactive',
      },
    });

    const totalEmployees = await this.prisma.employees.count({
      where: {
        hire_date: { lt: monthStart },
      },
    });

    const turnoverRate =
      totalEmployees > 0 ? (terminations / totalEmployees) * 100 : 0;

    if (turnoverRate > 5) {
      const hrDirectors = await this.getHRDirectors();

      await this.createAlert({
        type: AlertType.HIGH_TURNOVER,
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
        title: 'Tỷ lệ nghỉ việc cao',
        message: `Turnover rate tháng này đạt ${turnoverRate.toFixed(1)}%, vượt ngưỡng cảnh báo 5%`,
        metadata: {
          turnoverRate,
          terminations,
          totalEmployees,
        },
        targetUsers: hrDirectors,
      });
    }
  }

  async checkConsecutiveAbsentAlert(): Promise<void> {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const employees = await this.prisma.employees.findMany({
      where: { status: 'active' },
      include: {
        attendances: {
          where: {
            work_date: { gte: threeDaysAgo },
            status: 'absent',
          },
          orderBy: { work_date: 'asc' },
        },
        position: {
          include: { department: true },
        },
      },
    });

    for (const employee of employees) {
      if (employee.attendances.length >= 3) {
        const dates = employee.attendances.map((a) => a.work_date.getTime());
        let consecutive = 1;
        for (let i = 1; i < dates.length; i++) {
          const dayDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
          if (dayDiff === 1) {
            consecutive++;
            if (consecutive >= 3) {
              const managers = await this.getManagersByDepartment(
                employee.position.department_id,
              );
              const hrStaff = await this.getHRStaff();

              await this.createAlert({
                type: AlertType.CONSECUTIVE_ABSENT,
                severity: AlertSeverity.HIGH,
                status: AlertStatus.ACTIVE,
                title: 'Nhân viên vắng liên tiếp',
                message: `${employee.full_name} (${employee.employee_code}) vắng không phép ${consecutive} ngày liên tiếp`,
                metadata: {
                  employeeId: employee.id,
                  employeeName: employee.full_name,
                  employeeCode: employee.employee_code,
                  consecutiveDays: consecutive,
                },
                targetUsers: [...managers, ...hrStaff],
              });
              break;
            }
          } else {
            consecutive = 1;
          }
        }
      }
    }
  }

  async checkExcessiveOTAlert(): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const employees = await this.prisma.employees.findMany({
      where: { status: 'active' },
      include: {
        attendances: {
          where: {
            work_date: { gte: monthStart },
          },
        },
        position: {
          include: { department: true },
        },
      },
    });

    for (const employee of employees) {
      const totalOTMinutes = employee.attendances.reduce(
        (sum, att) => sum + att.overtime,
        0,
      );
      const totalOTHours = totalOTMinutes / 60;

      if (totalOTHours > 40) {
        const managers = await this.getManagersByDepartment(
          employee.position.department_id,
        );
        const hrStaff = await this.getHRStaff();

        await this.createAlert({
          type: AlertType.EXCESSIVE_OT,
          severity: AlertSeverity.MEDIUM,
          status: AlertStatus.ACTIVE,
          title: 'OT bất thường',
          message: `${employee.full_name} (${employee.employee_code}) có ${totalOTHours.toFixed(1)}h OT trong tháng, vượt ngưỡng 40h`,
          metadata: {
            employeeId: employee.id,
            employeeName: employee.full_name,
            employeeCode: employee.employee_code,
            totalOTHours,
          },
          targetUsers: [...managers, ...hrStaff],
        });
      }
    }
  }

  async checkKPIDropAlert(): Promise<void> {
    const recentCycles = await this.prisma.reviewCycles.findMany({
      orderBy: { created_at: 'desc' },
      take: 2,
      include: {
        reviews: {
          include: {
            employee: {
              include: {
                position: {
                  include: { department: true },
                },
              },
            },
          },
        },
      },
    });

    if (recentCycles.length < 2) return;

    const [currentCycle, previousCycle] = recentCycles;

    // So sánh điểm KPI
    for (const currentReview of currentCycle.reviews) {
      const previousReview = previousCycle.reviews.find(
        (r) => r.employee_id === currentReview.employee_id,
      );

      if (previousReview) {
        const scoreDrop =
          previousReview.total_score! - currentReview.total_score!;

        if (scoreDrop > 15) {
          const managers = await this.getManagersByDepartment(
            currentReview.employee.position.department_id,
          );

          await this.createAlert({
            type: AlertType.KPI_DROP,
            severity: AlertSeverity.HIGH,
            status: AlertStatus.ACTIVE,
            title: 'KPI giảm mạnh',
            message: `${currentReview.employee.full_name} (${currentReview.employee.employee_code}) có điểm KPI giảm ${scoreDrop} điểm so với kỳ trước`,
            metadata: {
              employeeId: currentReview.employee_id,
              employeeName: currentReview.employee.full_name,
              employeeCode: currentReview.employee.employee_code,
              currentScore: currentReview.total_score,
              previousScore: previousReview.total_score,
              scoreDrop,
            },
            targetUsers: managers,
          });
        }
      }
    }
  }

  private async getManagersByDepartment(
    departmentId?: string,
  ): Promise<string[]> {
    const managers = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        position: {
          level: 'manager',
          ...(departmentId && { department_id: departmentId }),
        },
      },
      select: { auth_user_id: true },
    });

    return managers.filter((m) => m.auth_user_id).map((m) => m.auth_user_id!);
  }

  private async getHRDirectors(): Promise<string[]> {
    const hrDept = await this.prisma.departments.findFirst({
      where: {
        department_code: { contains: 'HR' },
      },
    });

    if (!hrDept) return [];

    const directors = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        position: {
          level: 'manager',
          department_id: hrDept.id,
        },
      },
      select: { auth_user_id: true },
    });

    return directors.filter((d) => d.auth_user_id).map((d) => d.auth_user_id!);
  }

  private async getHRStaff(): Promise<string[]> {
    const hrDept = await this.prisma.departments.findFirst({
      where: {
        department_code: { contains: 'HR' },
      },
    });

    if (!hrDept) return [];

    const staff = await this.prisma.employees.findMany({
      where: {
        status: 'active',
        position: {
          department_id: hrDept.id,
        },
      },
      select: { auth_user_id: true },
    });

    return staff.filter((s) => s.auth_user_id).map((s) => s.auth_user_id!);
  }

  private async createNotification(
    userId: string,
    alertData: Omit<AlertData, 'id' | 'createdAt'>,
  ): Promise<void> {
    try {
      await this.prisma.notifications.create({
        data: {
          user_id: userId,
          type: 'timesheet_approved',
          title: alertData.title,
          body: alertData.message,
          is_read: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
    }
  }
}
