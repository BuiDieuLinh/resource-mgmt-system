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
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  checkIn(@Body() dto: CheckInDto) {
    return this.attendancesService.checkIn(dto);
  }

  @Post('check-out')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  checkOut(@Body() dto: CheckOutDto) {
    return this.attendancesService.checkOut(dto);
  }

  @Get('my')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findMy(
    @CurrentUser() user: { userId: string },
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.findByAuthUser(user.userId, month, year);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER)
  getSummaries(
    @Query('month', new DefaultValuePipe(CURRENT_MONTH), ParseIntPipe)
    month: number,
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.attendancesService.findSummaries(month, year);
  }

  @Get('employee/:employeeId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
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
  @Roles(Role.ADMIN, Role.MANAGER)
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
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendancesService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
