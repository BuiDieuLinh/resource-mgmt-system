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
import { HolidayService } from './holiday.service';
import {
  CreateHolidayDto,
  UpdateHolidayDto,
  QueryHolidayDto,
} from './dto/holiday.dto';

@Controller('holidays')
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
  create(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidayService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidayService.remove(id);
  }
}
