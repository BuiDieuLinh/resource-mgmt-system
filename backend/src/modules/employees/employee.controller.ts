import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryEmployeeDto) {
    return this.service.findAll(query);
  }

  @Get('export')
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
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded',
      };
    }

    return this.service.previewImport(file.buffer);
  }

  @Post('import')
  async importExcel(@Body() body: { employees: any[] }) {
    if (!body.employees || body.employees.length === 0) {
      return {
        success: false,
        message: 'No employees data provided',
      };
    }

    return this.service.importFromExcel(body.employees);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
