import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  UpdateLeaveRequestDto,
  QueryLeaveRequestDto,
  BulkUpdateLeaveStatusDto,
} from './dto/leave-request.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Get('my')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findMy(
    @CurrentUser() user: { employeeId: string },
    @Query('status') status?: string,
  ) {
    return this.leaveRequestService.findByEmployee(user.employeeId, status);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    const isAdmin = user.roles.some((r) =>
      [Role.ADMIN, Role.SUPER_ADMIN].includes(r as Role),
    );
    const isManager = user.roles.includes(Role.MANAGER);
    const isEmployeeOnly = !isAdmin && !isManager;

    if (isEmployeeOnly) {
      query.employee_id = [user.employeeId];
    } else if (isManager && !isAdmin) {
      const deptId = await this.leaveRequestService.getManagerDepartmentId(
        user.employeeId,
      );
      if (deptId) query.department_id = deptId;
    }
    return this.leaveRequestService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.leaveRequestService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestService.create(dto);
  }

  @Patch('bulk-status')
  @Roles(Role.ADMIN, Role.MANAGER)
  bulkUpdateStatus(
    @Body() dto: BulkUpdateLeaveStatusDto,
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    dto.actorRoles = user.roles;
    return this.leaveRequestService.bulkUpdateStatus(
      dto.ids,
      { status: dto.status, comment: dto.comment },
      user.employeeId,
      user.roles ?? [],
    );
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    return this.leaveRequestService.updateStatus(
      id,
      dto,
      user.employeeId,
      user.roles ?? [],
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  update(@Param('id') id: string, @Body() dto: UpdateLeaveRequestDto) {
    return this.leaveRequestService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.leaveRequestService.remove(id);
  }
}
