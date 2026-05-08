import { Page, Locator, expect } from '@playwright/test';
import { log } from './logger';

export async function fill(locator: Locator, value: string, label = ''): Promise<void> {
  log.info(`Fill "${label || 'field'}" with "${value}"`);
  await locator.waitFor({ state: 'visible' });
  await locator.clear();
  await locator.fill(value);
}

export async function click(locator: Locator, label = ''): Promise<void> {
  log.info(`Click "${label || 'element'}"`);
  await locator.waitFor({ state: 'visible' });
  await locator.click();
}

export async function selectOption(locator: Locator, value: string, label = ''): Promise<void> {
  log.info(`Select "${value}" in "${label || 'dropdown'}"`);
  await locator.waitFor({ state: 'visible' });
  await locator.click();

  const option = locator.page().getByRole('option', { name: value });
  await option.waitFor({ state: 'visible' });
  await option.click();
}

export async function clickButton(page: Page, name: string): Promise<void> {
  log.info(`Click button "${name}"`);
  const btn = page.getByRole('button', { name });
  await btn.waitFor({ state: 'visible' });
  await btn.click();
}

export async function waitForNotification(page: Page, text: string | RegExp): Promise<void> {
  log.info(`Wait for notification: "${text}"`);
  const notification = page.locator('[data-notifications-container]').getByText(text);
  await expect(notification).toBeVisible({ timeout: 8_000 });
  log.ok(`Notification appeared: "${text}"`);
}

export async function waitForLoadingToFinish(page: Page): Promise<void> {
  const loader = page.locator('[data-loader]');
  if ((await loader.count()) > 0) {
    await loader.first().waitFor({ state: 'hidden' });
  }
}

export async function confirmModal(page: Page): Promise<void> {
  log.step('Confirm modal dialog');
  const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i });
  await confirmBtn.waitFor({ state: 'visible' });
  await confirmBtn.click();
}
