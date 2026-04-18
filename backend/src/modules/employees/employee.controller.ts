import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { WorkScheduleService } from 'src/modules/work-schedules/work-schedule.service';
import { WorkScheduleDto } from 'src/modules/work-schedules/dto/work-schedule.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(
    private readonly service: EmployeeService,
    private readonly workScheduleService: WorkScheduleService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(
    @Query() query: QueryEmployeeDto,
    @CurrentUser() user: { userId: string; roles: string[] },
  ) {
    if (user.roles.includes(Role.MANAGER) && !user.roles.includes(Role.ADMIN)) {
      const deptId = await this.service.getManagerDepartmentId(user.userId);
      if (deptId) query.department_id = deptId;
    }
    return this.service.findAll(query);
  }

  @Get('check-exists')
  @Roles(Role.ADMIN)
  checkExists(
    @Query('field') field: 'employee_code' | 'email' | 'identify_card',
    @Query('value') value: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.service.checkExists(field, value, excludeId);
  }

  @Get('export')
  @Roles(Role.ADMIN)
  async exportExcel(@Res() res: Response) {
    const buffer = await this.service.exportToExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=employees_${new Date().getTime()}.xlsx`,
    );
    return res.send(buffer);
  }

  @Post('import/preview')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { success: false, message: 'No file uploaded' };
    return this.service.previewImport(file.buffer);
  }

  @Post('import')
  @Roles(Role.ADMIN)
  async importExcel(@Body() body: { employees: any[] }) {
    if (!body.employees?.length)
      return { success: false, message: 'No employees data provided' };
    return this.service.importFromExcel(body.employees);
  }

  @Get('by-user/:userId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id/work-schedule')
  getWorkSchedule(@Param('id') id: string) {
    return this.workScheduleService.findByEmployee(id);
  }

  @Put(':id/work-schedule')
  @Roles(Role.ADMIN)
  setWorkSchedule(@Param('id') id: string, @Body() dto: WorkScheduleDto[]) {
    return this.workScheduleService.setSchedule(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
