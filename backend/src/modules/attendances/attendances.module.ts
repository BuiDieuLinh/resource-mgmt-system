import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}
