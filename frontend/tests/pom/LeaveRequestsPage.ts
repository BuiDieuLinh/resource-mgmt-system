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

export class LeaveRequestsPage extends BasePage {
  readonly url = ROUTES.leaveRequests;

  get addButton() {
    return this.page.getByRole('button', { name: /new request|add/i });
  }
  get modal() {
    return this.page.getByRole('dialog');
  }
  get leaveTypeSelect() {
    return this.modal.getByLabel(/leave type/i);
  }
  get startDateInput() {
    return this.modal.getByLabel(/start date/i);
  }
  get endDateInput() {
    return this.modal.getByLabel(/end date/i);
  }
  get reasonInput() {
    return this.modal.getByLabel(/reason/i);
  }
  get submitButton() {
    return this.modal.getByRole('button', { name: /submit|create/i });
  }
  get tableRows() {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await waitForLoadingToFinish(this.page);
  }

  async openAddModal(): Promise<void> {
    log.step('Open New Leave Request modal');
    await click(this.addButton, 'New Request button');
    await expect(this.modal).toBeVisible();
  }

  async fillLeaveForm(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<void> {
    log.step('Fill leave request form');
    await selectOption(this.leaveTypeSelect, data.leaveType, 'Leave Type');
    await fill(this.startDateInput, data.startDate, 'Start Date');
    await fill(this.endDateInput, data.endDate, 'End Date');
    await fill(this.reasonInput, data.reason, 'Reason');
  }

  async submitForm(): Promise<void> {
    log.step('Submit leave request form');
    await click(this.submitButton, 'Submit button');
  }

  async approveRequest(rowText: string): Promise<void> {
    log.step(`Approve leave request: ${rowText}`);
    const row = this.tableRows.filter({ hasText: rowText });
    await row.getByRole('button', { name: /approve/i }).click();
    await waitForNotification(this.page, /approved/i);
  }

  async rejectRequest(rowText: string): Promise<void> {
    log.step(`Reject leave request: ${rowText}`);
    const row = this.tableRows.filter({ hasText: rowText });
    await row.getByRole('button', { name: /reject/i }).click();
    await waitForNotification(this.page, /rejected/i);
  }

  async assertRequestStatus(rowText: string, status: string): Promise<void> {
    log.info(`Assert request status: ${status}`);
    const row = this.tableRows.filter({ hasText: rowText });
    await expect(row.getByText(status, { exact: false })).toBeVisible();
  }
}
