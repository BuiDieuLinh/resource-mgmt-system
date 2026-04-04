import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthCoreService } from './auth-core.service';

@Module({
  imports: [HttpModule],
  providers: [AuthCoreService],
  exports: [AuthCoreService],
})
export class AuthCoreModule {}
