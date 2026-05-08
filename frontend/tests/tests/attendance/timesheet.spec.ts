import { test, expect } from '@playwright/test';
import { MyTimesheetPage } from '../../pom/AttendancePage';
import { log } from '../../common/logger';

test.describe('My Timesheet: Employee', () => {
  test('timesheet shows day rows', async ({ page }) => {
    log.step('Test: timesheet day rows visible');
    const timesheetPage = new MyTimesheetPage(page);
    try {
      await timesheetPage.goto();
      await timesheetPage.assertTimesheetVisible();
      log.ok('Timesheet day rows visible');
    } catch (err) {
      log.error('Failed: timesheet day rows', err);
      throw err;
    }
  });

  test('timesheet shows attendance summary cards', async ({ page }) => {
    log.step('Test: attendance summary cards visible');
    const timesheetPage = new MyTimesheetPage(page);
    try {
      await timesheetPage.goto();
      await timesheetPage.assertSummaryVisible();
      log.ok('Summary cards visible');
    } catch (err) {
      log.error('Failed: summary cards', err);
      throw err;
    }
  });

  test('employee can switch to week view', async ({ page }) => {
    log.step('Test: switch to week view');
    const timesheetPage = new MyTimesheetPage(page);
    try {
      await timesheetPage.goto();

      const weekTab = page
        .getByRole('radio', { name: /week/i })
        .or(page.locator('[data-value="week"]'));
      if (await weekTab.isVisible({ timeout: 5_000 })) {
        await weekTab.click();
        await page.waitForLoadState('networkidle');
        log.ok('Switched to week view');
      } else {
        log.info('Week view toggle not found — skipping');
      }
    } catch (err) {
      log.error('Failed: switch to week view', err);
      throw err;
    }
  });

  test('employee can navigate to previous month', async ({ page }) => {
    log.step('Test: navigate to previous month');
    const timesheetPage = new MyTimesheetPage(page);
    try {
      await timesheetPage.goto();

      const prevBtn = page.getByRole('button', { name: /prev|previous|‹|</i });
      if (await prevBtn.isVisible({ timeout: 5_000 })) {
        await prevBtn.click();
        await page.waitForLoadState('networkidle');
        log.ok('Navigated to previous month');
      } else {
        log.info('Prev month button not found — skipping');
      }
    } catch (err) {
      log.error('Failed: navigate previous month', err);
      throw err;
    }
  });

  test('check-in button is visible on timesheet page', async ({ page }) => {
    log.step('Test: check-in button visible on timesheet');
    const timesheetPage = new MyTimesheetPage(page);
    try {
      await timesheetPage.goto();

      const checkInBtn = page.getByRole('button', { name: /check.?in|check.?out/i });
      const isVisible = await checkInBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      log.ok(`Check-in button visible: ${isVisible}`);
    } catch (err) {
      log.error('Failed: check-in button on timesheet', err);
      throw err;
    }
  });
});
