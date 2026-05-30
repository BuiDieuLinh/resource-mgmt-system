import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { Role } from 'src/common/constant/roles';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { AuthService } from './auth.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return ResponseHelper.success(data, 'Login successful');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { userId: string }) {
    const data = await this.authService.getMe(user.userId);
    return ResponseHelper.success(data);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.userId, dto.newPassword);
    return ResponseHelper.success(null, 'Password changed successfully');
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async listRoles() {
    const data = await this.authService.listRoles();
    return ResponseHelper.success(data);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async listUsers() {
    const data = await this.authService.listUsers();
    return ResponseHelper.success(data);
  }

  @Post('roles/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignRole(@Body() dto: AssignRoleDto) {
    const data = await this.authService.assignRole(dto);
    return ResponseHelper.success(data, 'Role assigned');
  }

  @Delete('roles/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeRole(@Body() dto: AssignRoleDto) {
    const data = await this.authService.removeRole(dto);
    return ResponseHelper.success(data, 'Role removed');
  }

  @Post('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto) {
    const data = await this.authService.createUser(dto);
    return ResponseHelper.success(data, 'User created');
  }

  @Patch('admin/users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUserRoles(
    @Param('id') id: string,
    @Body('roles') roles: string[],
  ) {
    const data = await this.authService.updateUserRoles(id, roles);
    return ResponseHelper.success(data, 'Roles updated');
  }

  @Patch('admin/users/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    const data = await this.authService.updateUserStatus(id, status);
    return ResponseHelper.success(data, 'Status updated');
  }

  @Patch('admin/users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Param('id') id: string) {
    await this.authService.resetPassword(id);
    return ResponseHelper.success(null, 'Password reset to default');
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteUser(id);
    return ResponseHelper.success(null, 'User deleted');
  }
}
