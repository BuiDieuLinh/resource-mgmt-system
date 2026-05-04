import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { TemplateService } from './services/template.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerformanceController],
  providers: [PerformanceService, TemplateService],
  exports: [PerformanceService, TemplateService],
})
export class PerformanceModule {}
