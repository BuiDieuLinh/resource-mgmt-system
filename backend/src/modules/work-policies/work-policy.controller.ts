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
import { WorkPolicyService } from './work-policy.service';
import {
  CreateWorkPolicyDto,
  UpdateWorkPolicyDto,
} from './dto/work-policy.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';

@Controller('work-policies')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(Role.HR, Role.ADMIN)
  create(@Body() dto: CreateWorkPolicyDto) {
    return this.workPolicyService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.HR, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateWorkPolicyDto) {
    return this.workPolicyService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.HR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.workPolicyService.remove(id);
  }
}
