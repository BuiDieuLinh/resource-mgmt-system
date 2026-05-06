import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/constant/roles';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.EMPLOYEE)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getMyNotifications(@CurrentUser() user: { employeeId: string }) {
    return this.svc.getForUser(user.employeeId);
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: { employeeId: string },
  ) {
    return this.svc.markRead(id, user.employeeId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { employeeId: string }) {
    return this.svc.markAllRead(user.employeeId);
  }
}
