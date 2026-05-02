import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertSchedulerService {
  private readonly logger = new Logger(AlertSchedulerService.name);

  constructor(private alertsService: AlertsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyAlertChecks() {
    this.logger.log('Running hourly alert checks...');

    try {
      await this.alertsService.checkLateSpikeAlert();

      await this.alertsService.checkConsecutiveAbsentAlert();

      await this.alertsService.checkExcessiveOTAlert();

      this.logger.log('Hourly alert checks completed');
    } catch (error) {
      this.logger.error(`Hourly alert checks failed: ${error.message}`);
    }
  }

  @Cron('0 8 * * *')
  async runDailyAlertChecks() {
    this.logger.log('Running daily alert checks...');

    try {
      await this.alertsService.checkHighTurnoverAlert();

      await this.alertsService.checkKPIDropAlert();

      this.logger.log('Daily alert checks completed');
    } catch (error) {
      this.logger.error(`Daily alert checks failed: ${error.message}`);
    }
  }
}
