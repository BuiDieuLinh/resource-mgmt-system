import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkPolicyController } from './work-policy.controller';
import { WorkPolicyService } from './work-policy.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkPolicyController],
  providers: [WorkPolicyService],
  exports: [WorkPolicyService],
})
export class WorkPolicyModule {}
