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
import { WorkPolicyService } from './work-policy.service';
import { CreateWorkPolicyDto } from './dto/work-policy.dto';

@Controller('work-policies')
export class WorkPolicyController {
  constructor(private readonly workPolicyService: WorkPolicyService) {}

  @Get('active')
  getActive(@Query('date') date?: string) {
    return this.workPolicyService.getActive(date ? new Date(date) : undefined);
  }

  @Get()
  findAll() {
    return this.workPolicyService.findAll();
  }

  @Post()
  create(@Body() dto: CreateWorkPolicyDto) {
    return this.workPolicyService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateWorkPolicyDto) {
    return this.workPolicyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workPolicyService.remove(id);
  }
}
