import { Controller, Get, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constant/roles';
import { UpdateSettingDto } from './dto/update-notification-setting.dto';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly svc: RemindersService) {}

  @Get('settings')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getSettings() {
    return this.svc.getSettings();
  }

  @Patch('settings')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateSetting(
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: { employeeId: string },
  ) {
    return this.svc.updateSetting(
      dto.trigger_type,
      dto.channel,
      {
        is_enabled: dto.is_enabled,
        days_before: dto.days_before,
        repeat_interval_days: dto.repeat_interval_days,
      },
      user.employeeId,
    );
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  getDashboardReminders(
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    const isAdmin = user.roles.some((r) =>
      [Role.ADMIN, Role.SUPER_ADMIN].includes(r as Role),
    );
    return this.svc.getDashboardReminders(user.employeeId, isAdmin);
  }
}
