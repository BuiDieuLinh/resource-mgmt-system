import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/constant/roles';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === UserStatus.inactive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact your administrator.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const roles = user.userRoles.map((item) => item.role.name);
    const token = this.jwt.sign({ sub: user.id, roles });

    return {
      access_token: token,
      is_first_login: user.is_first_login,
      user: { id: user.id, email: user.email, roles },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      is_first_login: user.is_first_login,
      roles: user.userRoles.map((item) => item.role.name),
    };
  }

  async listRoles() {
    return this.prisma.roles.findMany({ orderBy: { name: 'asc' } });
  }

  async listUsers() {
    const users = await this.prisma.users.findMany({
      include: { userRoles: { include: { role: true } } },
      orderBy: { created_at: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      status: user.status,
      is_first_login: user.is_first_login,
      createdAt: user.created_at,
      roles: user.userRoles.map((item) => item.role.name),
    }));
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" already exists`);
    }

    const roleName = dto.defaultRole ?? Role.EMPLOYEE;
    const role = await this.prisma.roles.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    const defaultPassword =
      this.config.get<string>('DEFAULT_PASSWORD') ?? '888888';
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        password_hash,
        userRoles: { create: { roleId: role.id } },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((item) => item.role.name),
    };
  }

  async updateUserRoles(userId: string, roleNames: string[]) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const roles = await this.prisma.roles.findMany({
      where: { name: { in: roleNames } },
    });
    if (roles.length !== roleNames.length) {
      const found = roles.map((role) => role.name);
      const missing = roleNames.filter((name) => !found.includes(name));
      throw new NotFoundException(`Roles not found: ${missing.join(', ')}`);
    }

    await this.prisma.userRoles.deleteMany({ where: { userId } });
    if (roles.length > 0) {
      await this.prisma.userRoles.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id })),
      });
    }

    return { userId, roles: roleNames };
  }

  async assignRole(dto: AssignRoleDto) {
    const existing = await this.prisma.userRoles.findFirst({
      where: { userId: dto.userId, roleId: dto.roleId },
    });
    if (existing) throw new ConflictException('Role already assigned');

    return this.prisma.userRoles.create({
      data: { userId: dto.userId, roleId: dto.roleId },
    });
  }

  async removeRole(dto: AssignRoleDto) {
    const record = await this.prisma.userRoles.findFirst({
      where: { userId: dto.userId, roleId: dto.roleId },
    });
    if (!record) throw new NotFoundException('Role assignment not found');

    return this.prisma.userRoles.delete({ where: { id: record.id } });
  }

  async updateUserStatus(id: string, status: UserStatus) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({ where: { id }, data: { status } });
  }

  async softDeleteUser(id: string) {
    return this.updateUserStatus(id, UserStatus.inactive);
  }

  async resetPassword(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const defaultPassword =
      this.config.get<string>('DEFAULT_PASSWORD') ?? '888888';
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.users.update({
      where: { id },
      data: { password_hash, is_first_login: true },
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const password_hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash, is_first_login: false },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.employees.updateMany({
        where: { auth_user_id: id },
        data: { auth_user_id: null },
      });

      await tx.userRoles.deleteMany({
        where: { userId: id },
      });

      await tx.users.delete({
        where: { id },
      });
    });
  }
}
