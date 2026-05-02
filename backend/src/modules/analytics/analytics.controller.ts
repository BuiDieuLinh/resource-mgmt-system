import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constant/roles';

const CURRENT_YEAR = new Date().getFullYear();

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getOverview(
    @Query('year', new DefaultValuePipe(CURRENT_YEAR), ParseIntPipe)
    year: number,
  ) {
    return this.analyticsService.getOverview(year);
  }
}
