import { Page, expect } from '@playwright/test';
import { navigateTo } from '../common/navigation';
import { log } from '../common/logger';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract readonly url: string;

  async goto(): Promise<void> {
    await navigateTo(this.page, this.url);
    await this.waitForPage();
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async assertCurrentUrl(expected: string | RegExp): Promise<void> {
    log.info(`Assert URL: ${expected}`);
    await expect(this.page).toHaveURL(expected);
  }

  async assertPageTitle(text: string | RegExp): Promise<void> {
    log.info(`Assert page title contains: ${text}`);
    await expect(this.page.getByRole('heading').first()).toContainText(text);
  }
}
