import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto/template.dto';
import { CreateCriteriaDto, UpdateCriteriaDto } from '../dto/criteria.dto';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const templates = await this.prisma.evaluationTemplates.findMany({
      include: {
        criteria: true,
        cycles: true,
        _count: {
          select: {
            criteria: true,
            cycles: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return ResponseHelper.success(templates);
  }

  async findOne(id: string) {
    const template = await this.prisma.evaluationTemplates.findUnique({
      where: { id },
      include: {
        criteria: {
          orderBy: {
            weight: 'desc',
          },
        },
        _count: {
          select: {
            criteria: true,
            cycles: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return ResponseHelper.success(template);
  }

  async create(dto: CreateTemplateDto) {
    const template = await this.prisma.evaluationTemplates.create({
      data: {
        title: dto.title,
        description: dto.description,
        apply_to: dto.apply_to ?? [],
      },
      include: {
        _count: { select: { criteria: true, cycles: true } },
      },
    });

    if (dto.criteria && dto.criteria.length > 0) {
      const totalWeight = dto.criteria.reduce((s, c) => s + c.weight, 0);
      if (totalWeight !== 100) {
        await this.prisma.evaluationTemplates.delete({
          where: { id: template.id },
        });
        throw new BadRequestException(
          `Total criteria weight must equal 100%. Got: ${totalWeight}%`,
        );
      }
      await this.prisma.evaluationCriteria.createMany({
        data: dto.criteria.map((c) => ({
          template_id: template.id,
          criterion: c.criterion,
          weight: c.weight,
          max_score: c.max_score,
          score_type: c.score_type,
        })),
      });
    }

    return this.findOne(template.id);
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);

    const updated = await this.prisma.evaluationTemplates.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.apply_to !== undefined && { apply_to: dto.apply_to }),
      },
    });

    if (dto.criteria !== undefined) {
      const totalWeight = dto.criteria.reduce((s, c) => s + c.weight, 0);
      if (totalWeight !== 100) {
        throw new BadRequestException(
          `Total criteria weight must equal 100%. Got: ${totalWeight}%`,
        );
      }
      await this.prisma.evaluationCriteria.deleteMany({
        where: { template_id: id },
      });
      if (dto.criteria.length > 0) {
        await this.prisma.evaluationCriteria.createMany({
          data: dto.criteria.map((c) => ({
            template_id: id,
            criterion: c.criterion,
            weight: c.weight,
            max_score: c.max_score,
            score_type: c.score_type,
          })),
        });
      }
    }

    return this.findOne(updated.id);
  }

  async toggle(id: string) {
    const template = await this.findOne(id);

    const updated = await this.prisma.evaluationTemplates.update({
      where: { id },
      data: {
        is_active: !template.data.is_active,
      },
    });
    return ResponseHelper.success(updated, 'Template status updated');
  }

  async addCriteria(templateId: string, dto: CreateCriteriaDto) {
    const template = await this.findOne(templateId);

    const currentWeight = template.data.criteria.reduce(
      (sum, c) => sum + c.weight,
      0,
    );
    const newWeight = currentWeight + dto.weight;

    if (newWeight > 100) {
      throw new BadRequestException(
        `Total weight cannot exceed 100%. Current: ${currentWeight}%, Adding: ${dto.weight}%`,
      );
    }

    const criteria = await this.prisma.evaluationCriteria.create({
      data: {
        template_id: templateId,
        criterion: dto.criterion,
        weight: dto.weight,
        max_score: dto.max_score,
        score_type: dto.score_type,
      },
    });

    return ResponseHelper.success(criteria, 'Criteria added successfully');
  }

  async updateCriteria(id: string, dto: UpdateCriteriaDto) {
    const criteria = await this.prisma.evaluationCriteria.findUnique({
      where: { id },
      include: { template: { include: { criteria: true } } },
    });

    if (!criteria) {
      throw new NotFoundException('Criteria not found');
    }

    const otherCriteriaWeight = criteria.template.criteria
      .filter((c) => c.id !== id)
      .reduce((sum, c) => sum + c.weight, 0);

    const newTotalWeight = otherCriteriaWeight + dto.weight;

    if (newTotalWeight > 100) {
      throw new BadRequestException(
        `Total weight cannot exceed 100%. Other criteria: ${otherCriteriaWeight}%, New: ${dto.weight}%`,
      );
    }

    const updated = await this.prisma.evaluationCriteria.update({
      where: { id },
      data: {
        criterion: dto.criterion,
        weight: dto.weight,
        max_score: dto.max_score,
        score_type: dto.score_type,
      },
    });

    return ResponseHelper.success(updated, 'Criteria updated successfully');
  }

  async deleteCriteria(id: string) {
    const criteria = await this.prisma.evaluationCriteria.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            cycles: true,
          },
        },
      },
    });

    if (!criteria) {
      throw new NotFoundException('Criteria not found');
    }

    if (criteria.template.cycles.length > 0) {
      throw new BadRequestException(
        'Cannot delete criteria from template that is being used in review cycles',
      );
    }

    await this.prisma.evaluationCriteria.delete({
      where: { id },
    });

    return ResponseHelper.success(null, 'Criteria deleted successfully');
  }
}
