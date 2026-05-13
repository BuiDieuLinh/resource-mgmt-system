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
import { HolidayService } from './holiday.service';
import {
  CreateHolidayDto,
  UpdateHolidayDto,
  QueryHolidayDto,
} from './dto/holiday.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';

@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  findAll(@Query() query: QueryHolidayDto) {
    return this.holidayService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayService.findOne(id);
  }

  @Post()
  @Roles(Role.HR, Role.ADMIN)
  create(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.HR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidayService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.HR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.holidayService.remove(id);
  }
}
