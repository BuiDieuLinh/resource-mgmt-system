import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './services/alerts.service';
import { AlertQueryDto } from './dto/alerts.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Lấy danh sách cảnh báo' })
  async getAlerts(@Query() query: AlertQueryDto) {
    return this.alertsService.getAlerts(query);
  }

  @Post(':id/acknowledge')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Xác nhận đã xem cảnh báo' })
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @CurrentUser() user: any,
  ) {
    await this.alertsService.acknowledgeAlert(alertId, user.userId);
    return { message: 'Alert acknowledged successfully' };
  }

  @Post(':id/resolve')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Đánh dấu cảnh báo đã xử lý' })
  async resolveAlert(@Param('id') alertId: string, @CurrentUser() user: any) {
    await this.alertsService.resolveAlert(alertId, user.userId);
    return { message: 'Alert resolved successfully' };
  }

  @Post('check/late-spike')
  @Roles('admin')
  @ApiOperation({ summary: 'Kiểm tra cảnh báo đi trễ tăng đột biến' })
  async checkLateSpikeAlert(@Body('departmentId') departmentId?: string) {
    await this.alertsService.checkLateSpikeAlert(departmentId);
    return { message: 'Late spike alert check completed' };
  }

  @Post('check/high-turnover')
  @Roles('admin')
  @ApiOperation({ summary: 'Kiểm tra cảnh báo turnover cao' })
  async checkHighTurnoverAlert() {
    await this.alertsService.checkHighTurnoverAlert();
    return { message: 'High turnover alert check completed' };
  }

  @Post('check/consecutive-absent')
  @Roles('admin')
  @ApiOperation({ summary: 'Kiểm tra cảnh báo vắng liên tiếp' })
  async checkConsecutiveAbsentAlert() {
    await this.alertsService.checkConsecutiveAbsentAlert();
    return { message: 'Consecutive absent alert check completed' };
  }

  @Post('check/excessive-ot')
  @Roles('admin')
  @ApiOperation({ summary: 'Kiểm tra cảnh báo OT bất thường' })
  async checkExcessiveOTAlert() {
    await this.alertsService.checkExcessiveOTAlert();
    return { message: 'Excessive OT alert check completed' };
  }

  @Post('check/kpi-drop')
  @Roles('admin')
  @ApiOperation({ summary: 'Kiểm tra cảnh báo KPI giảm mạnh' })
  async checkKPIDropAlert() {
    await this.alertsService.checkKPIDropAlert();
    return { message: 'KPI drop alert check completed' };
  }
}
