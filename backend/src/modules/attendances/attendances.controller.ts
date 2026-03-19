import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CURRENT_MONTH, CURRENT_YEAR } from 'src/common/constant';
import type { LeaveStatus } from '@prisma/client';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get('summary')
  getSummaries(
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.findSummaries(month, year);
  }

  @Get('employee/:employeeId')
  findByEmployee(
    @Param('employeeId') employeeId: string,
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.findByEmployee(employeeId, month, year);
  }

  @Patch('employee/:employeeId/approve')
  approveTimesheet(
    @Param('employeeId') employeeId: string,
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.approveEmployeeTimesheet(
      employeeId,
      month,
      year,
    );
  }

  @Patch('leave-requests/:id')
  updateLeaveRequest(
    @Param('id') id: string,
    @Body('status') status: LeaveStatus,
  ) {
    return this.attendancesService.updateLeaveRequest(id, status);
  }

  @Get()
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendancesService.findAll(query);
  }

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
