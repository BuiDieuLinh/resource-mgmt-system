import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  QueryLeaveRequestDto,
} from './dto/leave-request.dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLeaveRequestDto) {
    const where: any = {};
    if (query.employee_id) where.employee_id = query.employee_id;
    if (query.status) where.status = query.status;

    const requests = await this.prisma.leaveRequests.findMany({
      where,
      include: { employee: true },
      orderBy: { created_at: 'desc' },
    });
    return ResponseHelper.success(requests);
  }

  async findOne(id: string) {
    const request = await this.prisma.leaveRequests.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException(`Leave request ${id} not found`);
    return ResponseHelper.success(request);
  }

  async create(dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employees.findUnique({
      where: { id: dto.employee_id },
    });
    if (!employee)
      throw new NotFoundException(`Employee ${dto.employee_id} not found`);

    const created = await this.prisma.leaveRequests.create({
      data: {
        employee_id: dto.employee_id,
        leave_type: dto.leave_type,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        leave_start_minutes: dto.leave_start_minutes ?? null,
        leave_end_minutes: dto.leave_end_minutes ?? null,
        reason: dto.reason ?? null,
      },
    });
    return ResponseHelper.success(created, 'Leave request submitted');
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);

    const data: any = { status: dto.status };
    if (dto.status === LeaveStatus.approved) {
      data.admin_approved_at = new Date();
    }

    const updated = await this.prisma.leaveRequests.update({
      where: { id },
      data,
    });
    return ResponseHelper.success(updated, `Leave request ${dto.status}`);
  }

  async remove(id: string) {
    const existing = await this.prisma.leaveRequests.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Leave request ${id} not found`);
    await this.prisma.leaveRequests.delete({ where: { id } });
    return ResponseHelper.success(null, 'Leave request deleted');
  }
}
