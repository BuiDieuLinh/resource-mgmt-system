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
  QueryLeaveRequestDto,
} from './dto/leave-request.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: QueryLeaveRequestDto) {
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

  @Delete(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.leaveRequestService.remove(id);
  }
}
