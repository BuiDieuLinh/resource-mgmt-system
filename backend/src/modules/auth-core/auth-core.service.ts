import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthCoreService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('AUTH_CORE_URL') ?? 'http://localhost:5001';
    this.apiKey = this.config.get<string>('INTERNAL_API_KEY') ?? '';
  }

  async createUser(email: string, defaultRole = 'employee') {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/auth/users`,
          { email, defaultRole },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return res.data.data as { id: string; email: string; roles: string[] };
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      throw new InternalServerErrorException(`Auth service error: ${msg}`);
    }
  }

  async deleteUser(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/auth/users/${id}`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
    } catch {
      // rollback best-effort, không throw
    }
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive') {
    try {
      await firstValueFrom(
        this.http.patch(
          `${this.baseUrl}/auth/users/${id}/status`,
          { status },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message;
      throw new InternalServerErrorException(`Auth service error: ${msg}`);
    }
  }
}
