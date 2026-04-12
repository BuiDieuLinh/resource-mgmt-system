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
    @CurrentUser() user: { userId: string },
    @Query('status') status?: string,
  ) {
    return this.leaveRequestService.findByAuthUser(user.userId, status);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    if (user.roles.includes(Role.MANAGER) && !user.roles.includes(Role.ADMIN)) {
      const deptId = await this.leaveRequestService.getManagerDepartmentId(
        user.userId,
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

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveStatusDto) {
    return this.leaveRequestService.updateStatus(id, dto);
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
