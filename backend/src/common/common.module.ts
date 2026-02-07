import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [],
  exports: [HttpModule],
})
export class CommonModule {}

