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
import { TemplateService } from './services/template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constant/roles';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { CreateReviewDto, SubmitReviewDto } from './dto/create-review.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { CreateCriteriaDto, UpdateCriteriaDto } from './dto/criteria.dto';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(
    private readonly svc: PerformanceService,
    private readonly templateSvc: TemplateService,
  ) {}

  @Get('templates')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getTemplates() {
    return this.templateSvc.findAll();
  }

  @Get('templates/:id')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getTemplate(@Param('id') id: string) {
    return this.templateSvc.findOne(id);
  }

  @Post('templates')
  @Roles(Role.HR, Role.ADMIN)
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templateSvc.create(dto);
  }

  @Patch('templates/:id')
  @Roles(Role.HR, Role.ADMIN)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateSvc.update(id, dto);
  }

  @Patch('templates/:id/toggle')
  @Roles(Role.HR, Role.ADMIN)
  toggleTemplate(@Param('id') id: string) {
    return this.templateSvc.toggle(id);
  }

  @Post('templates/:id/criteria')
  @Roles(Role.HR, Role.ADMIN)
  addCriteria(@Param('id') id: string, @Body() dto: CreateCriteriaDto) {
    return this.templateSvc.addCriteria(id, dto);
  }

  @Patch('criteria/:id')
  @Roles(Role.HR, Role.ADMIN)
  updateCriteria(@Param('id') id: string, @Body() dto: UpdateCriteriaDto) {
    return this.templateSvc.updateCriteria(id, dto);
  }

  @Delete('criteria/:id')
  @Roles(Role.HR, Role.ADMIN)
  deleteCriteria(@Param('id') id: string) {
    return this.templateSvc.deleteCriteria(id);
  }

  @Post('cycles')
  @Roles(Role.HR, Role.ADMIN)
  createCycle(
    @Body() dto: CreateCycleDto,
    @CurrentUser() user: { employeeId: string },
  ) {
    return this.svc.createCycle(dto, user.employeeId);
  }

  @Get('cycles')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getCycles() {
    return this.svc.getCycles();
  }

  @Get('my-cycles')
  getMyCycles(@CurrentUser() user: { employeeId: string }) {
    return this.svc.getMyCycles(user.employeeId);
  }

  @Get('cycles/:id')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getCycleById(@Param('id') id: string) {
    return this.svc.getCycleById(id);
  }

  @Post('reviews')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  createReview(@Body() dto: CreateReviewDto) {
    return this.svc.createReview(dto);
  }

  @Patch('reviews/:id/submit')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  submitReview(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: { employeeId: string },
  ) {
    return this.svc.submitReview(id, dto, user.employeeId);
  }

  @Patch('cycles/:id/publish')
  @Roles(Role.HR, Role.ADMIN)
  publishReviews(@Param('id') id: string) {
    return this.svc.publishReviews(id);
  }

  @Get('cycles/:id/reviews')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  getReviewsByCycle(
    @Param('id') id: string,
    @CurrentUser() user: { employeeId: string; roles: string[] },
  ) {
    const isAdmin = user.roles.some((r) => [Role.ADMIN].includes(r as Role));
    return this.svc.getReviewsByCycle(id, user.employeeId, isAdmin);
  }

  @Get('cycles/:id/my-review')
  getMyReview(
    @Param('id') id: string,
    @CurrentUser() user: { employeeId: string },
  ) {
    return this.svc.getMyReview(id, user.employeeId);
  }

  @Get('awards/pending-reveal')
  getPendingReveal(@CurrentUser() user: { employeeId: string }) {
    return this.svc.getPendingReveal(user.employeeId);
  }

  @Post('awards')
  @Roles(Role.HR, Role.ADMIN)
  createAward(@Body() dto: CreateAwardDto) {
    return this.svc.createAward(dto);
  }

  @Delete('awards/:id')
  @Roles(Role.HR, Role.ADMIN)
  deleteAward(@Param('id') id: string) {
    return this.svc.deleteAward(id);
  }

  @Get('cycles/:id/awards')
  @Roles(Role.HR, Role.MANAGER, Role.ADMIN, Role.EMPLOYEE)
  getAwardsByCycle(@Param('id') id: string) {
    return this.svc.getAwardsByCycle(id);
  }

  @Get('my-awards')
  getMyAwards(@CurrentUser() user: { employeeId: string }) {
    return this.svc.getMyAwards(user.employeeId);
  }
}
