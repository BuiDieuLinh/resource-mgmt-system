import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { HrReportsService } from './services/hr-reports.service';
import { InsightsService } from './services/insights.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [HrReportsService, InsightsService],
  exports: [HrReportsService, InsightsService],
})
export class ReportsModule {}
