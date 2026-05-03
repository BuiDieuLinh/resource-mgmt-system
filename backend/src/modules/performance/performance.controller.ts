import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constant/roles';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreateReviewDto, SubmitReviewDto } from './dto/create-review.dto';
import { CreateAwardDto } from './dto/create-award.dto';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly svc: PerformanceService) {}

  @Post('cycles')
  @Roles(Role.ADMIN)
  createCycle(
    @Body() dto: CreateCycleDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.createCycle(dto, user.userId);
  }

  @Get('cycles')
  @Roles(Role.ADMIN, Role.MANAGER)
  getCycles() {
    return this.svc.getCycles();
  }

  @Get('cycles/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  getCycleById(@Param('id') id: string) {
    return this.svc.getCycleById(id);
  }

  @Post('reviews')
  @Roles(Role.ADMIN, Role.MANAGER)
  createReview(@Body() dto: CreateReviewDto) {
    return this.svc.createReview(dto);
  }

  @Patch('reviews/:id/submit')
  @Roles(Role.ADMIN, Role.MANAGER)
  submitReview(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.submitReview(id, dto, user.userId);
  }

  @Patch('cycles/:id/publish')
  @Roles(Role.ADMIN)
  publishReviews(@Param('id') id: string) {
    return this.svc.publishReviews(id);
  }

  @Get('cycles/:id/reviews')
  @Roles(Role.ADMIN, Role.MANAGER)
  getReviewsByCycle(@Param('id') id: string) {
    return this.svc.getReviewsByCycle(id);
  }

  @Get('cycles/:id/my-review')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getMyReview(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.getMyReview(id, user.userId);
  }

  @Get('awards/pending-reveal')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getPendingReveal(@CurrentUser() user: { userId: string }) {
    return this.svc.getPendingReveal(user.userId);
  }

  @Post('awards')
  @Roles(Role.ADMIN)
  createAward(@Body() dto: CreateAwardDto) {
    return this.svc.createAward(dto);
  }

  @Delete('awards/:id')
  @Roles(Role.ADMIN)
  deleteAward(@Param('id') id: string) {
    return this.svc.deleteAward(id);
  }

  @Get('cycles/:id/awards')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getAwardsByCycle(@Param('id') id: string) {
    return this.svc.getAwardsByCycle(id);
  }

  @Get('my-awards')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getMyAwards(@CurrentUser() user: { userId: string }) {
    return this.svc.getMyAwards(user.userId);
  }
}
