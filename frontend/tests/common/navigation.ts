import { Page } from '@playwright/test';
import { log } from './logger';

export async function navigateTo(page: Page, path: string): Promise<void> {
  log.step(`Navigate to ${path}`);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  log.ok(`Arrived at ${path}`);
}

export async function waitForUrl(page: Page, urlPattern: string | RegExp): Promise<void> {
  log.info(`Waiting for URL: ${urlPattern}`);
  await page.waitForURL(urlPattern);
  log.ok(`URL matched: ${page.url()}`);
}

export async function reloadPage(page: Page): Promise<void> {
  log.step('Reload page');
  await page.reload();
  await page.waitForLoadState('networkidle');
  log.ok('Page reloaded');
}
