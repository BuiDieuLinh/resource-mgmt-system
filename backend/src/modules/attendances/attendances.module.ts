import { Module, Logger } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { WorkPolicyModule } from '../work-policies/work-policy.module';
import { WifiGuard } from './guards/wifi.guard';

@Module({
  imports: [PrismaModule, WorkPolicyModule],
  controllers: [AttendancesController],
  providers: [AttendancesService, WifiGuard, Logger],
  exports: [AttendancesService],
})
export class AttendancesModule {}
