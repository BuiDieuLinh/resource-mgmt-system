import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../common/routes';
import {
  click,
  fill,
  selectOption,
  waitForNotification,
  waitForLoadingToFinish,
} from '../common/actions';
import { log } from '../common/logger';

export class PerformanceCyclesPage extends BasePage {
  readonly url = ROUTES.performanceCycles;

  get newCycleButton() {
    return this.page.getByRole('button', { name: /new cycle/i });
  }
  get modal() {
    return this.page.getByRole('dialog');
  }
  get titleInput() {
    return this.modal.getByLabel(/cycle name/i);
  }
  get typeSelect() {
    return this.modal.getByLabel(/type/i);
  }
  get yearInput() {
    return this.modal.getByLabel(/year/i);
  }
  get seqInput() {
    return this.modal.getByLabel(/month|quarter/i);
  }
  get announceDateInput() {
    return this.modal.getByLabel(/announce date/i);
  }
  get submitButton() {
    return this.modal.getByRole('button', { name: /create/i });
  }
  get tableRows() {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await waitForLoadingToFinish(this.page);
  }

  async openNewCycleModal(): Promise<void> {
    log.step('Open New Cycle modal');
    await click(this.newCycleButton, 'New Cycle button');
    await expect(this.modal).toBeVisible();
  }

  async fillCycleForm(data: {
    title: string;
    type: string;
    year: string;
    seq: string;
    announceDate: string;
  }): Promise<void> {
    log.step(`Fill cycle form: ${data.title}`);
    await fill(this.titleInput, data.title, 'Cycle Name');
    await selectOption(this.typeSelect, data.type, 'Type');
    await fill(this.yearInput, data.year, 'Year');
    await fill(this.seqInput, data.seq, 'Period');
    await fill(this.announceDateInput, data.announceDate, 'Announce Date');
  }

  async submitForm(): Promise<void> {
    log.step('Submit cycle form');
    await click(this.submitButton, 'Create button');
  }

  async clickCycleRow(title: string): Promise<void> {
    log.step(`Click cycle row: ${title}`);
    const row = this.tableRows.filter({ hasText: title });
    await row.click();
  }

  async assertCycleExists(title: string): Promise<void> {
    log.info(`Assert cycle exists: ${title}`);
    await expect(this.tableRows.filter({ hasText: title })).toBeVisible();
  }
}
