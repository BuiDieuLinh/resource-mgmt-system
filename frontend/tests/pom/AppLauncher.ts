import { BasePage } from './BasePage';
import { AUTH_ROUTES } from '../common/routes';
import type { Page } from '@playwright/test';

export class AppLauncher extends BasePage {
  readonly url = AUTH_ROUTES.appLauncher;

  get rmsAppLink() {
    return this.page.getByRole('link', { name: 'RMS Core HR & org structure' });
  }
  get userManagementLink() {
    return this.page.getByRole('link', { name: /user management/i });
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.rmsAppLink.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async launchRMS(): Promise<Page> {
    const target = await this.rmsAppLink.getAttribute('target');

    if (target === '_blank' || target === '_new') {
      const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.rmsAppLink.click(),
      ]);
      await newPage.waitForLoadState('networkidle');
      return newPage;
    }

    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
      this.rmsAppLink.click(),
    ]);
    await this.page.waitForLoadState('networkidle');
    return this.page;
  }

  async launchUserManagement(): Promise<void> {
    await this.userManagementLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}
