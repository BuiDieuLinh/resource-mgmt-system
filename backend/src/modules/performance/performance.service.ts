import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreateReviewDto, SubmitReviewDto } from './dto/create-review.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { ReviewStatus } from '@prisma/client';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async createCycle(dto: CreateCycleDto, creatorEmployeeId: string) {
    const existing = await this.prisma.reviewCycles.findUnique({
      where: {
        period_type_period_year_period_seq: {
          period_type: dto.period_type,
          period_year: dto.period_year,
          period_seq: dto.period_seq,
        },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'A review cycle already exists for this period',
      );
    }

    const cycle = await this.prisma.reviewCycles.create({
      data: {
        title: dto.title,
        period_type: dto.period_type,
        period_year: dto.period_year,
        period_seq: dto.period_seq,
        announce_date: new Date(dto.announce_date),
        template_id: dto.template_id,
        created_by: creatorEmployeeId,
      },
      include: {
        template: { include: { criteria: true } },
      },
    });

    const assignments = await this.syncCycleAssignments(
      cycle,
      dto.assignments ?? [],
      creatorEmployeeId,
    );
    await this.notifyReviewersForNewCycle(cycle.id, cycle.title, assignments);

    return ResponseHelper.success(cycle, 'Review cycle created');
  }

  async updateCycle(
    id: string,
    dto: UpdateCycleDto,
    updaterEmployeeId: string,
  ) {
    const existing = await this.prisma.reviewCycles.findUnique({
      where: { id },
      include: {
        reviews: {
          select: {
            status: true,
            total_score: true,
            comment: true,
            achievements: true,
            score_details: {
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!existing) throw new NotFoundException('Review cycle not found');
    const hasPublishedReviews = existing.reviews.some(
      (review) => review.status === ReviewStatus.published,
    );
    if (hasPublishedReviews) {
      throw new BadRequestException('Completed review cycles cannot be edited');
    }

    const duplicate = await this.prisma.reviewCycles.findUnique({
      where: {
        period_type_period_year_period_seq: {
          period_type: dto.period_type,
          period_year: dto.period_year,
          period_seq: dto.period_seq,
        },
      },
      select: { id: true },
    });
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException(
        'Another review cycle already exists for this period',
      );
    }

    const cycle = await this.prisma.reviewCycles.update({
      where: { id },
      data: {
        title: dto.title,
        period_type: dto.period_type,
        period_year: dto.period_year,
        period_seq: dto.period_seq,
        announce_date: new Date(dto.announce_date),
        template_id: dto.template_id,
      },
      include: {
        template: { include: { criteria: true } },
      },
    });

    await this.syncCycleAssignments(
      cycle,
      dto.assignments ?? [],
      updaterEmployeeId,
    );

    return ResponseHelper.success(cycle, 'Review cycle updated');
  }

  async getCycles() {
    const cycles = await this.prisma.reviewCycles.findMany({
      orderBy: [{ period_year: 'desc' }, { period_seq: 'desc' }],
      include: {
        template: true,
        reviews: {
          select: {
            id: true,
            status: true,
          },
        },
        assignments: {
          include: {
            employee: true,
            reviewer: { select: { id: true, full_name: true, email: true } },
          },
        },
        _count: { select: { reviews: true, awards: true, assignments: true } },
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
        reviews: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: { select: { reviews: true, awards: true, assignments: true } },
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
        assignments: {
          include: {
            employee: {
              include: { position: { include: { department: true } } },
            },
            reviewer: { select: { id: true, full_name: true, email: true } },
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

  async createReview(dto: CreateReviewDto, reviewerAuthId: string) {
    const cycle = await this.prisma.reviewCycles.findUnique({
      where: { id: dto.cycle_id },
    });
    if (!cycle) throw new NotFoundException('Cycle not found');

    const assignment = await this.prisma.reviewAssignments.findUnique({
      where: {
        cycle_id_employee_id: {
          cycle_id: dto.cycle_id,
          employee_id: dto.employee_id,
        },
      },
      select: { id: true, reviewer_id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Review assignment not found');
    }
    const employee = await this.prisma.employees.findUnique({
      where: { id: dto.employee_id },
      select: { manager_id: true },
    });
    const canReview =
      assignment.reviewer_id === reviewerAuthId ||
      employee?.manager_id === reviewerAuthId;
    if (!canReview) {
      throw new ForbiddenException(
        'You are not assigned to review this employee',
      );
    }

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
        assignment_id: assignment.id,
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
        assignment_id: assignment.id,
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
      include: {
        assignment: {
          select: {
            reviewer_id: true,
          },
        },
        employee: {
          select: {
            manager_id: true,
          },
        },
      },
    });
    if (!review) throw new NotFoundException('Review not found');
    const canReview =
      review.assignment?.reviewer_id === reviewerAuthId ||
      review.employee?.manager_id === reviewerAuthId;
    if (!canReview) {
      throw new ForbiddenException(
        'You are not assigned to submit this review',
      );
    }

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
    isPrivileged = true,
  ) {
    const reviews = await this.prisma.performanceReviews.findMany({
      where: {
        cycle_id: cycleId,
        ...(!isPrivileged &&
          callerEmployeeId && {
            assignment: { reviewer_id: callerEmployeeId },
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

  private async syncCycleAssignments(
    cycle: {
      id: string;
      title: string;
      period_type: string;
      period_year: number;
      period_seq: number;
    },
    assignments: Array<{ employee_id: string; reviewer_id?: string }>,
    actorEmployeeId: string,
  ) {
    const normalizedAssignments = assignments.filter((a) => a.employee_id);
    const employeeIds = normalizedAssignments.map((a) => a.employee_id);

    const employees = employeeIds.length
      ? await this.prisma.employees.findMany({
          where: { id: { in: employeeIds } },
          select: {
            id: true,
            full_name: true,
            manager_id: true,
            employee_code: true,
          },
        })
      : [];
    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

    const existingAssignments = await this.prisma.reviewAssignments.findMany({
      where: { cycle_id: cycle.id },
      select: { id: true, employee_id: true },
    });
    const existingEmployeeIds = new Set(
      existingAssignments.map((assignment) => assignment.employee_id),
    );
    const nextEmployeeIds = new Set(employeeIds);
    const removedAssignmentIds = existingAssignments
      .filter((assignment) => !nextEmployeeIds.has(assignment.employee_id))
      .map((assignment) => assignment.id);

    if (removedAssignmentIds.length) {
      await this.prisma.performanceReviews.deleteMany({
        where: { assignment_id: { in: removedAssignmentIds } },
      });
      await this.prisma.reviewAssignments.deleteMany({
        where: { id: { in: removedAssignmentIds } },
      });
    }

    const savedAssignments: Array<{
      reviewer_id: string;
      reviewer_name: string;
      reviewer_email: string | null;
      reviewer_level: string | null;
      employee_id: string;
      employee_name: string;
    }> = [];

    for (const a of normalizedAssignments) {
      const employee = employeeMap.get(a.employee_id);
      if (!employee) continue;

      let reviewerId = a.reviewer_id;
      if (!reviewerId) {
        reviewerId = employee.manager_id ?? actorEmployeeId;
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
        (sum, att) => sum + (att.overtime ?? 0),
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

      const reviewer = await this.prisma.employees.findUnique({
        where: { id: reviewerId },
        select: {
          id: true,
          full_name: true,
          email: true,
          position: { select: { level: true } },
        },
      });
      if (!reviewer) continue;

      savedAssignments.push({
        reviewer_id: reviewer.id,
        reviewer_name: reviewer.full_name,
        reviewer_email: reviewer.email,
        reviewer_level: reviewer.position?.level ?? null,
        employee_id: employee.id,
        employee_name: employee.full_name,
      });
    }

    return savedAssignments;
  }

  private async notifyReviewersForNewCycle(
    cycleId: string,
    cycleTitle: string,
    assignments: Array<{
      reviewer_id: string;
      reviewer_name: string;
      reviewer_email: string | null;
      reviewer_level: string | null;
      employee_id: string;
      employee_name: string;
    }>,
  ) {
    const reviewerMap = new Map<
      string,
      {
        reviewerName: string;
        reviewerEmail: string | null;
        reviewerLevel: string | null;
        employees: Array<{ id: string; name: string }>;
      }
    >();

    for (const assignment of assignments) {
      if (!['manager', 'lead'].includes(assignment.reviewer_level ?? '')) {
        continue;
      }

      if (!reviewerMap.has(assignment.reviewer_id)) {
        reviewerMap.set(assignment.reviewer_id, {
          reviewerName: assignment.reviewer_name,
          reviewerEmail: assignment.reviewer_email,
          reviewerLevel: assignment.reviewer_level,
          employees: [],
        });
      }
      reviewerMap.get(assignment.reviewer_id)!.employees.push({
        id: assignment.employee_id,
        name: assignment.employee_name,
      });
    }

    const notifications = Array.from(reviewerMap.entries()).map(
      ([reviewerId, reviewer]) => ({
        user_id: reviewerId,
        type: 'eval_cycle_started' as const,
        title: `New review cycle: ${cycleTitle}`,
        body: `You have ${reviewer.employees.length} employee${reviewer.employees.length > 1 ? 's' : ''} assigned for review in cycle "${cycleTitle}".`,
        link: `/performance/review?cycleId=${cycleId}${reviewer.employees[0]?.id ? `&employeeId=${reviewer.employees[0].id}` : ''}`,
      }),
    );
    await this.notificationsService.createMany(notifications);

    await Promise.all(
      Array.from(reviewerMap.values()).map(async (reviewer) => {
        if (!reviewer.reviewerEmail) return;

        const employeeList = reviewer.employees
          .map((employee, index) => `${index + 1}. ${employee.name}`)
          .join('<br/>');
        const firstEmployeeId = reviewer.employees[0]?.id;

        await this.mailService.sendReminderEmail({
          to: reviewer.reviewerEmail,
          recipientName: reviewer.reviewerName,
          subject: `[Review Cycle] ${cycleTitle}`,
          body: `You have been assigned to review the following employees in cycle "<strong>${cycleTitle}</strong>":<br/><br/>${employeeList}`,
          ctaUrl: `${process.env.VITE_APP_URL ?? 'http://localhost:5173'}/performance/review?cycleId=${cycleId}${firstEmployeeId ? `&employeeId=${firstEmployeeId}` : ''}`,
          ctaLabel: 'Open review workspace',
        });
      }),
    );
  }
}
