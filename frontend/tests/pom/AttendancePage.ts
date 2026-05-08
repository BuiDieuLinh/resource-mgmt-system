import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../common/routes';
import { waitForLoadingToFinish } from '../common/actions';
import { log } from '../common/logger';

export class MyTimesheetPage extends BasePage {
  readonly url = ROUTES.myTimesheet;

  get monthNavigator() {
    return this.page.locator('[data-month-navigator], input[type="month"]').first();
  }
  get dayRows() {
    return this.page
      .locator('[data-testid="day-row-timesheet"]')
      .filter({ hasText: /\d{2}\/\d{2}/ });
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await waitForLoadingToFinish(this.page);
  }

  async assertTimesheetVisible(): Promise<void> {
    log.info('Assert timesheet rows visible');
    await expect(this.dayRows.first()).toBeVisible({ timeout: 10_000 });
  }

  async assertSummaryVisible(): Promise<void> {
    log.info('Assert summary cards visible');
    await expect(this.page.getByText(/plan|actual|late|absent|overtime/i).first()).toBeVisible({
      timeout: 8_000,
    });
  }
}

export class CheckInOutPage extends BasePage {
  readonly url = ROUTES.checkInOut;

  get checkInButton() {
    return this.page.getByRole('button', { name: /check.?in/i });
  }
  get checkOutButton() {
    return this.page.getByRole('button', { name: /check.?out/i });
  }
  get statusText() {
    return this.page.getByText(/checked in|not checked in|already checked/i);
  }
  get gpsSignalActive() {
    return this.page
      .getByText('GPS Signal')
      .locator('../../..')
      .getByText(/active/i);
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await waitForLoadingToFinish(this.page);
  }
}
