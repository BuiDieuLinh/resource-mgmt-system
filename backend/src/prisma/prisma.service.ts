import { Injectable } from '@nestjs/common';
const { PrismaClient } = require('.prisma/client');
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      log: ['error', 'warn'],
    });
  }
}
