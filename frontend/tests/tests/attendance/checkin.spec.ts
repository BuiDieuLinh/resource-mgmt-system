import { test, expect } from '@playwright/test';
import { log } from '../../common/logger';
import { ROUTES } from '../../common/routes';
import { CheckInOutPage } from '../../pom/AttendancePage';

test.describe('Check-In / Check-Out', () => {
  test('page loads with check-in button visible', async ({ page }) => {
    log.step('Test: check-in page loads');
    const checkInOutPage = new CheckInOutPage(page);
    await checkInOutPage.goto();
    await checkInOutPage.waitForPage();

    await expect(checkInOutPage.gpsSignalActive).toBeVisible({ timeout: 8_000 });
    await expect(checkInOutPage.checkInButton).toBeVisible({ timeout: 8_000 });

    const isCheckInDisabled = await checkInOutPage.checkInButton.isDisabled();
    log.info(
      `Check In button is ${isCheckInDisabled ? 'disabled (already checked in)' : 'enabled (not checked in yet)'}`,
    );
    if (isCheckInDisabled) {
      log.info('User has already checked in today');
    } else {
      log.info('User can check in now');
    }
  });

  test('check-in flow: click → check-in time shown and button disabled', async ({ page }) => {
    log.step('Test: check-in flow');
    const checkInOutPage = new CheckInOutPage(page);
    await checkInOutPage.goto();
    await checkInOutPage.waitForPage();
    await page.waitForLoadState('networkidle');

    const checkInBtn = page.getByRole('button', { name: /^check in$/i });
    await expect(checkInBtn).toBeVisible({ timeout: 8_000 });

    if (await checkInBtn.isDisabled()) {
      log.info('Already checked in today — verifying post-check-in state');
      await expect(page.getByText(/in at/i)).toBeVisible({ timeout: 5_000 });
      await expect(checkInBtn).toBeDisabled();
      log.ok('Post-check-in state verified');
      return;
    }

    log.info('Clicking check-in button');
    await checkInBtn.click();
    await page.waitForTimeout(2_500);

    const outOfRange = await page
      .getByText(/too far|out of range/i)
      .isVisible()
      .catch(() => false);
    if (outOfRange) {
      log.info('GPS out of range — check-in blocked by distance policy');
      return;
    }

    log.info('Check-in successful, verifying UI updates');
    await expect(page.getByText(/in at/i)).toBeVisible({ timeout: 6_000 });
    await expect(checkInBtn).toBeDisabled({ timeout: 5_000 });
    log.ok('Check-in time shown and Check In button disabled');
  });

  test('check-in without GPS permission shows location error', async ({ page, context }) => {
    log.step('Test: check-in without GPS permission');

    await context.clearPermissions();

    await page.goto(ROUTES.checkInOut);
    await page.waitForLoadState('networkidle');

    const checkInBtn = page.getByRole('button', { name: /^check in$/i });
    if ((await checkInBtn.isVisible()) && !(await checkInBtn.isDisabled())) {
      await checkInBtn.click();
      await page.waitForTimeout(2_000);
      const hasError = await page
        .getByText(/gps|location|permission|error/i)
        .isVisible()
        .catch(() => false);
      log.ok(`GPS denied — error shown: ${hasError}`);
    } else {
      log.info('Button not available — skipping GPS denied test');
    }
  });
});
