import { Page, expect, Locator } from '@playwright/test';
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

export class EmployeesPage extends BasePage {
  readonly url = ROUTES.employees;

  get addButton() {
    return this.page.getByRole('button', { name: /add employee|new employee/i });
  }
  get searchInput() {
    return this.page.getByPlaceholder(/search/i);
  }
  get table() {
    return this.page.getByRole('table');
  }
  get tableRows() {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }
  get editButtons() {
    return this.tableRows.getByRole('button', { name: /edit/i });
  }
  get viewDetailsButton() {
    return this.tableRows.getByRole('button', { name: /view details/i });
  }

  get modal() {
    return this.page.getByRole('dialog');
  }
  get codeInput() {
    return this.modal.getByLabel(/employee code/i);
  }
  get fullNameInput() {
    return this.modal.getByLabel(/full name/i);
  }
  get emailInput() {
    return this.modal.getByLabel(/email/i);
  }
  get phoneInput() {
    return this.modal.getByLabel(/phone/i);
  }
  get idCardInput() {
    return this.modal.getByLabel(/identity card/i);
  }
  get addressInput() {
    return this.modal.getByLabel(/address/i);
  }
  get genderSelect() {
    return this.modal.getByLabel(/gender/i);
  }
  get positionSelect() {
    return this.modal.getByLabel(/position/i);
  }
  get hireDateInput() {
    return this.modal.getByLabel(/hire date/i);
  }
  get dobInput() {
    return this.modal.getByLabel(/date of birth/i);
  }
  get managerSelect() {
    return this.modal.getByLabel(/manager/i);
  }
  get submitButton() {
    return this.modal.getByRole('button', { name: /create|update/i });
  }
  get cancelButton() {
    return this.modal.getByRole('button', { name: /cancel/i });
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await waitForLoadingToFinish(this.page);
  }

  async openAddModal(): Promise<void> {
    log.step('Open Add Employee modal');
    await click(this.addButton, 'Add Employee button');
    await expect(this.modal).toBeVisible();
  }

  async fillEmployeeForm(data: {
    code: string;
    fullName: string;
    email: string;
    phone: string;
    idCard: string;
    address: string;
    gender?: string;
    hireDate?: string;
    dob?: string;
  }): Promise<void> {
    log.step(`Fill employee form: ${data.code}`);
    await fill(this.codeInput, data.code, 'Employee Code');
    await fill(this.fullNameInput, data.fullName, 'Full Name');
    await fill(this.emailInput, data.email, 'Email');
    await fill(this.phoneInput, data.phone, 'Phone');
    await fill(this.idCardInput, data.idCard, 'Identity Card');
    await fill(this.addressInput, data.address, 'Address');

    if (data.gender) await selectOption(this.genderSelect, data.gender, 'Gender');
    if (data.hireDate) await fill(this.hireDateInput, data.hireDate, 'Hire Date');
    if (data.dob) await fill(this.dobInput, data.dob, 'Date of Birth');
  }

  async selectPosition(): Promise<void> {
    log.step(`Selecting position ...}`);
    await this.positionSelect.click();
    await this.positionSelect.page().getByRole('option').first().click();
  }

  async selectManager(managerName: string): Promise<void> {
    log.step(`Selecting manager: ${managerName}`);
    await selectOption(this.managerSelect, managerName, 'Manager');
  }

  async submitForm(): Promise<void> {
    log.step('Submit employee form');
    await click(this.submitButton, 'Submit button');
  }

  async waitForSuccessNotification(): Promise<void> {
    await waitForNotification(this.page, /success|created|updated/i);
  }

  async searchEmployee(query: string): Promise<void> {
    log.step(`Search employee: "${query}"`);
    await fill(this.searchInput, query, 'Search input');
    await waitForLoadingToFinish(this.page);

    await expect(this.table).toBeVisible();
    await expect(this.tableRows.getByText(query, { exact: true })).toBeVisible();
  }

  async getRowByCode(code: string): Promise<Locator> {
    return this.tableRows.filter({ hasText: code });
  }

  async clickEditOnRow(code: string): Promise<void> {
    log.step(`Click edit on row: ${code}`);
    const row = await this.getRowByCode(code);
    await row.getByRole('button', { name: /edit/i }).click();
    await expect(this.modal).toBeVisible();
  }

  async clickDeleteOnRow(code: string): Promise<void> {
    log.step(`Click delete on row: ${code}`);
    const row = await this.getRowByCode(code);
    await row.getByRole('button', { name: /delete/i }).click();
  }

  async assertRowExists(code: string): Promise<void> {
    log.info(`Assert row exists: ${code}`);
    const row = await this.getRowByCode(code);
    await expect(row).toBeVisible();
  }

  async assertRowNotExists(code: string): Promise<void> {
    log.info(`Assert row not exists: ${code}`);
    const row = await this.getRowByCode(code);
    await expect(row).not.toBeVisible();
  }
}
