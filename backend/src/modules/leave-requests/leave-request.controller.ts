import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
  QueryLeaveRequestDto,
} from './dto/leave-request.dto';

@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Get()
  findAll(@Query() query: QueryLeaveRequestDto) {
    return this.leaveRequestService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveRequestService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveStatusDto) {
    return this.leaveRequestService.updateStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveRequestService.remove(id);
  }
}
