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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CURRENT_MONTH, CURRENT_YEAR } from 'src/common/constant';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR, Role.ADMIN)
  checkIn(@Body() dto: CheckInDto) {
    return this.attendancesService.checkIn(dto);
  }

  @Post('check-out')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR, Role.ADMIN)
  checkOut(@Body() dto: CheckOutDto) {
    return this.attendancesService.checkOut(dto);
  }

  @Get('my')
  findMy(
    @CurrentUser() user: { employeeId: string },
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.findByEmployee(user.employeeId, month, year);
  }

  @Get('summary')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getSummaries(
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
    @Query('department_id') departmentId?: string,
  ) {
    return this.attendancesService.findSummaries(month, year, departmentId);
  }

  @Get('employee/:employeeId')
  @Roles(Role.HR, Role.MANAGER, Role.EMPLOYEE, Role.ADMIN)
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
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
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
  async findAll(
    @Query() query: QueryAttendanceDto,
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    if (query.employee_id && query.employee_id === user.employeeId) {
      return this.attendancesService.findAll(query);
    }

    const hasPermission =
      user.roles.includes(Role.HR) || user.roles.includes(Role.MANAGER);
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view all attendances',
      );
    }

    return this.attendancesService.findAll(query);
  }

  @Post()
  @Roles(Role.HR, Role.ADMIN)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.HR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.HR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
