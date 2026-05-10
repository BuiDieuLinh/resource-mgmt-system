import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreateReviewDto, SubmitReviewDto } from './dto/create-review.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(dto: CreateCycleDto, creatorEmployeeId: string) {
    const cycle = await this.prisma.reviewCycles.upsert({
      where: {
        period_type_period_year_period_seq: {
          period_type: dto.period_type,
          period_year: dto.period_year,
          period_seq: dto.period_seq,
        },
      },
      create: {
        title: dto.title,
        period_type: dto.period_type,
        period_year: dto.period_year,
        period_seq: dto.period_seq,
        announce_date: new Date(dto.announce_date),
        template_id: dto.template_id,
        created_by: creatorEmployeeId,
      },
      update: {
        title: dto.title,
        announce_date: new Date(dto.announce_date),
        template_id: dto.template_id,
      },
      include: {
        template: { include: { criteria: true } },
      },
    });

    if (dto.assignments && dto.assignments.length > 0) {
      for (const a of dto.assignments) {
        if (!a.employee_id) continue;

        let reviewerId = a.reviewer_id;
        if (!reviewerId) {
          const emp = await this.prisma.employees.findUnique({
            where: { id: a.employee_id },
            select: { manager_id: true },
          });
          reviewerId = emp?.manager_id ?? creatorEmployeeId;
        }

        if (!reviewerId) continue;

        const assignment = await this.prisma.reviewAssignments.upsert({
          where: {
            cycle_id_employee_id: {
              cycle_id: cycle.id,
              employee_id: a.employee_id,
            },
          },
          create: {
            cycle_id: cycle.id,
            employee_id: a.employee_id,
            reviewer_id: reviewerId,
          },
          update: {
            reviewer_id: reviewerId,
          },
        });

        const { gte, lte } = this.getCycleDateRange(cycle);
        const attendances = await this.prisma.attendances.findMany({
          where: { employee_id: a.employee_id, work_date: { gte, lte } },
        });
        const attendance_days = attendances.filter(
          (att) => att.check_in_time,
        ).length;
        const late_count = attendances.filter((att) => att.late > 0).length;
        const absent_count = attendances.filter(
          (att) => !att.check_in_time,
        ).length;
        const overtime_minutes = attendances.reduce(
          (s, att) => s + (att.overtime ?? 0),
          0,
        );

        await this.prisma.performanceReviews.upsert({
          where: {
            cycle_id_employee_id: {
              cycle_id: cycle.id,
              employee_id: a.employee_id,
            },
          },
          create: {
            cycle_id: cycle.id,
            employee_id: a.employee_id,
            assignment_id: assignment.id,
            status: ReviewStatus.draft,
            attendance_days,
            late_count,
            absent_count,
            overtime_minutes,
          },
          update: {
            assignment_id: assignment.id,
            attendance_days,
            late_count,
            absent_count,
            overtime_minutes,
          },
        });
      }
    }

    return ResponseHelper.success(cycle, 'Review cycle created');
  }

  async getCycles() {
    const cycles = await this.prisma.reviewCycles.findMany({
      orderBy: [{ period_year: 'desc' }, { period_seq: 'desc' }],
      include: {
        template: true,
        _count: { select: { reviews: true, awards: true } },
      },
    });
    return ResponseHelper.success(cycles);
  }

  async getMyCycles(employeeId: string) {
    if (!employeeId) throw new NotFoundException('Employee not found');

    const cycles = await this.prisma.reviewCycles.findMany({
      where: {
        reviews: {
          some: {
            employee_id: employeeId,
          },
        },
      },
      orderBy: [{ period_year: 'desc' }, { period_seq: 'desc' }],
      include: {
        template: true,
        _count: { select: { reviews: true, awards: true } },
      },
    });
    return ResponseHelper.success(cycles);
  }

  async getCycleById(id: string) {
    const cycle = await this.prisma.reviewCycles.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            employee: {
              include: { position: { include: { department: true } } },
            },
            assignment: {
              include: { reviewer: { select: { id: true, full_name: true } } },
            },
          },
        },
        awards: {
          include: {
            employee: {
              include: { position: { include: { department: true } } },
            },
          },
          orderBy: [{ category: 'asc' }, { rank: 'asc' }],
        },
      },
    });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return ResponseHelper.success(cycle);
  }

  async createReview(dto: CreateReviewDto) {
    const cycle = await this.prisma.reviewCycles.findUnique({
      where: { id: dto.cycle_id },
    });
    if (!cycle) throw new NotFoundException('Cycle not found');

    const { gte, lte } = this.getCycleDateRange(cycle);
    const attendances = await this.prisma.attendances.findMany({
      where: { employee_id: dto.employee_id, work_date: { gte, lte } },
    });

    const attendance_days = attendances.filter((a) => a.check_in_time).length;
    const late_count = attendances.filter((a) => a.late > 0).length;
    const absent_count = attendances.filter((a) => !a.check_in_time).length;
    const overtime_minutes = attendances.reduce(
      (s, a) => s + (a.overtime ?? 0),
      0,
    );

    const review = await this.prisma.performanceReviews.upsert({
      where: {
        cycle_id_employee_id: {
          cycle_id: dto.cycle_id,
          employee_id: dto.employee_id,
        },
      },
      create: {
        cycle_id: dto.cycle_id,
        employee_id: dto.employee_id,
        total_score: dto.total_score,
        comment: dto.comment,
        achievements: dto.achievements,
        attendance_days,
        late_count,
        absent_count,
        overtime_minutes,
        status: ReviewStatus.draft,
      },
      update: {
        total_score: dto.total_score,
        comment: dto.comment,
        achievements: dto.achievements,
        attendance_days,
        late_count,
        absent_count,
        overtime_minutes,
      },
    });

    if (dto.score_details && dto.score_details.length > 0) {
      await this.prisma.scoreDetails.deleteMany({
        where: { review_id: review.id },
      });
      await this.prisma.scoreDetails.createMany({
        data: dto.score_details.map((sd) => ({
          review_id: review.id,
          criteria_id: sd.criteria_id,
          criteria_name: sd.criteria_name,
          weight: sd.weight,
          max_score: sd.max_score,
          score: sd.score,
          note: sd.note,
        })),
      });
    }

    const full = await this.prisma.performanceReviews.findUnique({
      where: { id: review.id },
      include: { score_details: true },
    });
    return ResponseHelper.success(full, 'Review saved');
  }

  async submitReview(id: string, dto: SubmitReviewDto, reviewerAuthId: string) {
    const review = await this.prisma.performanceReviews.findUnique({
      where: { id },
    });
    if (!review) throw new NotFoundException('Review not found');

    if (dto.score_details && dto.score_details.length > 0) {
      await this.prisma.scoreDetails.deleteMany({ where: { review_id: id } });
      await this.prisma.scoreDetails.createMany({
        data: dto.score_details.map((sd) => ({
          review_id: id,
          criteria_id: sd.criteria_id,
          criteria_name: sd.criteria_name,
          weight: sd.weight,
          max_score: sd.max_score,
          score: sd.score,
          note: sd.note,
        })),
      });
    }

    const updated = await this.prisma.performanceReviews.update({
      where: { id },
      data: {
        ...(dto.total_score !== undefined && { total_score: dto.total_score }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
        ...(dto.achievements !== undefined && {
          achievements: dto.achievements,
        }),
        status: ReviewStatus.submitted,
      },
      include: { score_details: true },
    });
    return ResponseHelper.success(updated, 'Review submitted');
  }

  async publishReviews(cycleId: string) {
    await this.prisma.performanceReviews.updateMany({
      where: { cycle_id: cycleId, status: ReviewStatus.submitted },
      data: { status: ReviewStatus.published },
    });
    return ResponseHelper.success(null, 'Reviews published');
  }

  async getMyReview(cycleId: string, employeeId: string) {
    if (!employeeId) throw new NotFoundException('Employee not found');

    const review = await this.prisma.performanceReviews.findUnique({
      where: {
        cycle_id_employee_id: { cycle_id: cycleId, employee_id: employeeId },
      },
      include: {
        assignment: {
          include: { reviewer: { select: { id: true, full_name: true } } },
        },
      },
    });
    if (!review || review.status !== ReviewStatus.published)
      return ResponseHelper.success(null);

    const { total_score: _total_score, ...safeReview } = review;
    return ResponseHelper.success(safeReview);
  }

  async getReviewsByCycle(
    cycleId: string,
    callerEmployeeId?: string,
    isAdmin = true,
  ) {
    let departmentFilter: string | undefined;
    if (!isAdmin && callerEmployeeId) {
      const caller = await this.prisma.employees.findUnique({
        where: { id: callerEmployeeId },
        select: { position: { select: { department_id: true } } },
      });
      departmentFilter = caller?.position?.department_id ?? undefined;
    }

    const reviews = await this.prisma.performanceReviews.findMany({
      where: {
        cycle_id: cycleId,
        ...(departmentFilter && {
          employee: { position: { department_id: departmentFilter } },
        }),
      },
      include: {
        employee: { include: { position: { include: { department: true } } } },
        assignment: {
          include: { reviewer: { select: { id: true, full_name: true } } },
        },
        score_details: { orderBy: { weight: 'desc' } },
      },
      orderBy: { total_score: 'desc' },
    });
    return ResponseHelper.success(reviews);
  }

  async createAward(dto: CreateAwardDto) {
    const existing = await this.prisma.awards.findUnique({
      where: {
        cycle_id_employee_id_category: {
          cycle_id: dto.cycle_id,
          employee_id: dto.employee_id,
          category: dto.category,
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        'Award already exists for this employee in this cycle/category',
      );

    const award = await this.prisma.awards.create({
      data: {
        cycle_id: dto.cycle_id,
        employee_id: dto.employee_id,
        category: dto.category,
        rank: dto.rank,
        title: dto.title,
        description: dto.description,
      },
      include: {
        employee: { include: { position: { include: { department: true } } } },
        cycle: true,
      },
    });
    return ResponseHelper.success(award, 'Award created');
  }

  async deleteAward(id: string) {
    await this.prisma.awards.delete({ where: { id } });
    return ResponseHelper.success(null, 'Award deleted');
  }

  async getAwardsByCycle(cycleId: string) {
    const awards = await this.prisma.awards.findMany({
      where: { cycle_id: cycleId },
      include: {
        employee: { include: { position: { include: { department: true } } } },
      },
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
    });
    return ResponseHelper.success(awards);
  }

  async getPendingReveal(employeeId: string) {
    if (!employeeId) return ResponseHelper.success(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const awards = await this.prisma.awards.findMany({
      where: {
        employee_id: employeeId,
        cycle: { announce_date: { gte: today, lt: tomorrow } },
      },
      include: {
        cycle: true,
        employee: { include: { position: { include: { department: true } } } },
      },
    });

    return ResponseHelper.success(awards);
  }

  async getMyAwards(employeeId: string) {
    if (!employeeId) throw new NotFoundException('Employee not found');

    const awards = await this.prisma.awards.findMany({
      where: { employee_id: employeeId },
      include: { cycle: true },
      orderBy: { created_at: 'desc' },
    });
    return ResponseHelper.success(awards);
  }

  private getCycleDateRange(cycle: {
    period_type: string;
    period_year: number;
    period_seq: number;
  }) {
    if (cycle.period_type === 'monthly') {
      const gte = new Date(cycle.period_year, cycle.period_seq - 1, 1);
      const lte = new Date(cycle.period_year, cycle.period_seq, 0);
      return { gte, lte };
    }
    const startMonth = (cycle.period_seq - 1) * 3;
    const gte = new Date(cycle.period_year, startMonth, 1);
    const lte = new Date(cycle.period_year, startMonth + 3, 0);
    return { gte, lte };
  }
}
