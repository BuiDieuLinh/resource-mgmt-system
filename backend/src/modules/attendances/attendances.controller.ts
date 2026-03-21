import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CURRENT_MONTH, CURRENT_YEAR } from 'src/common/constant';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto) {
    return this.attendancesService.checkIn(dto);
  }

  @Post('check-out')
  checkOut(@Body() dto: CheckOutDto) {
    return this.attendancesService.checkOut(dto);
  }

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

  @Get()
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendancesService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
