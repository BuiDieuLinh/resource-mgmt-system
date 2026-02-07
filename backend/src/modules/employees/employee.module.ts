import { Module } from '@nestjs/common'
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}