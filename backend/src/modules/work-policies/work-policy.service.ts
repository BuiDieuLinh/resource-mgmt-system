import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  CreateWorkPolicyDto,
  UpdateWorkPolicyDto,
} from './dto/work-policy.dto';

@Injectable()
export class WorkPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(date?: Date) {
    const target = date ?? new Date();
    const policy = await this.prisma.workPolicies.findFirst({
      where: {
        effective_from: { lte: target },
        OR: [{ effective_to: null }, { effective_to: { gte: target } }],
      },
      orderBy: { effective_from: 'desc' },
    });
    return ResponseHelper.success(policy);
  }

  async findAll() {
    const policies = await this.prisma.workPolicies.findMany({
      orderBy: { effective_from: 'desc' },
    });
    return ResponseHelper.success(policies);
  }

  async create(dto: CreateWorkPolicyDto) {
    const created = await this.prisma.workPolicies.create({
      data: {
        is_flexible_enabled: dto.is_flexible_enabled,
        flexible_start: dto.flexible_start ?? null,
        flexible_end: dto.flexible_end ?? null,
        check_in_cutoff_minutes: dto.check_in_cutoff_minutes ?? null,
        break_start: dto.break_start ?? null,
        break_end: dto.break_end ?? null,
        office_latitude: dto.office_latitude ?? null,
        office_longitude: dto.office_longitude ?? null,
        max_distance_meters: dto.max_distance_meters ?? null,
        effective_from: new Date(dto.effective_from),
        effective_to: dto.effective_to ? new Date(dto.effective_to) : null,
      },
    });
    return ResponseHelper.success(created, 'Work policy created');
  }

  async update(id: string, dto: UpdateWorkPolicyDto) {
    const existing = await this.prisma.workPolicies.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Policy ${id} not found`);

    const now = new Date();
    const isActive =
      existing.effective_from <= now &&
      (!existing.effective_to || existing.effective_to >= now);
    if (!isActive) {
      throw new BadRequestException(
        `Work policy ${id} is inactive and cannot be updated.`,
      );
    }

    if (dto.effective_to) {
      const effectiveTo = new Date(dto.effective_to);
      if (effectiveTo < existing.effective_from) {
        throw new BadRequestException(
          'effective_to must be greater than or equal to effective_from',
        );
      }
    }

    const updated = await this.prisma.workPolicies.update({
      where: { id },
      data: {
        effective_to: dto.effective_to ? new Date(dto.effective_to) : null,
      },
    });
    return ResponseHelper.success(updated, 'Work policy updated');
  }

  async remove(id: string) {
    throw new BadRequestException(
      `Work policy ${id} cannot be deleted. Set effective_to to end the policy and create a new one for future changes.`,
    );
  }
}
