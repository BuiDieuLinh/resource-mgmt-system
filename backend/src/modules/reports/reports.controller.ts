import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { HrReportsService } from './services/hr-reports.service';
import { InsightsService } from './services/insights.service';
import {
  HrStructureQueryDto,
  InsightsQueryDto,
  TurnoverQueryDto,
} from './dto/hr-reports.dto';
import { Role } from 'src/common/constant/roles';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private hrReportsService: HrReportsService,
    private insightsService: InsightsService,
  ) {}

  @Get('hr/structure')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Báo cáo cơ cấu nhân sự' })
  async getHrStructure(@Query() query: HrStructureQueryDto) {
    const data = await this.hrReportsService.getHrStructure(query);
    return { data };
  }

  @Get('hr/turnover')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Báo cáo biến động nhân sự và turnover rate' })
  async getTurnoverReport(@Query() query: TurnoverQueryDto) {
    const data = await this.hrReportsService.getTurnoverReport(query);
    return { data };
  }

  @Get('insights')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Lấy insights tương quan tự động' })
  async getInsights(@Query() query: InsightsQueryDto) {
    const data = await this.insightsService.getInsights(query);
    return { data };
  }
}
