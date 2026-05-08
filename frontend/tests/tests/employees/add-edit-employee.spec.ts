import { expect, test } from '@playwright/test';
import { log } from '../../common/logger';
import { EMPLOYEE_CREATE_DATA } from '../../data/test-data';
import { ROUTES } from '../../common/routes';
import { ENV } from '../../common/env';
import { EmployeesPage } from '../../pom/EmployeesPage';

test.describe('Add + Edit Employee', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });
  let employeeCreated = '';
  test('Add employee', async ({ page }) => {
    log.step('Test: admin can add employee');
    const employeePage = new EmployeesPage(page);

    try {
      await page.goto(`${ENV.baseUrl}${ROUTES.employees}`);
      await page.waitForLoadState('networkidle');

      await employeePage.openAddModal();
      await employeePage.fillEmployeeForm(EMPLOYEE_CREATE_DATA);
      await employeePage.selectPosition();
      await employeePage.selectManager('Admin System');
      await employeePage.submitForm();
      await employeePage.waitForPage();
      employeeCreated = EMPLOYEE_CREATE_DATA.fullName;

      await employeePage.searchEmployee(employeeCreated);
      log.ok('Employee added successfully');
    } catch (err) {
      log.error('Failed: add employee', err);
      throw err;
    }
  });

  test('Edit employee', async ({ page }) => {
    log.step('Test: admin can edit employee');
    const employeePage = new EmployeesPage(page);

    try {
      await page.goto(`${ENV.baseUrl}${ROUTES.employees}`);
      await page.waitForLoadState('networkidle');

      await employeePage.searchEmployee(employeeCreated);
      const row = await employeePage.getRowByCode(EMPLOYEE_CREATE_DATA.code);
      await employeePage.editButtons.click();

      const newName = EMPLOYEE_CREATE_DATA.fullName + ' Edited';
      await employeePage.fullNameInput.fill(newName);
      await employeePage.submitForm();
      await employeePage.waitForPage();

      await employeePage.searchEmployee(newName);
      await expect(employeePage.tableRows.filter({ hasText: newName })).toBeVisible();
      log.ok('Employee edited successfully');
    } catch (err) {
      log.error('Failed: edit employee', err);
      throw err;
    }
  });
});
