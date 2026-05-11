import { expect, test } from '@playwright/test';
import { log } from '../../common/logger';
import { EMPLOYEE_CREATE_DATA } from '../../data/test-data';
import { ROUTES } from '../../common/routes';
import { ENV } from '../../common/env';
import { EmployeesPage } from '../../pom/EmployeesPage';
import { ROLES } from '../../common/env';

test.describe('Add + Edit Employee', () => {
  let employeeCreated = '';

  test.beforeEach(async ({}, testInfo) => {
    const role = testInfo.project.name;

    log.info(`=================================`);
    log.info(`Running with role: ${role}`);
    log.info(`Test: ${testInfo.title}`);
    log.info(`=================================`);
  });

  test('Admin can add employee', async ({ page }, testInfo) => {
    const role = testInfo.project.name;

    if (role !== ROLES.ADMIN) {
      log.warn(`[SKIP] ${role} is not allowed to run this test`);
      return;
    }

    const employeePage = new EmployeesPage(page);

    try {
      await page.goto(`${ENV.baseUrl}${ROUTES.employees}`);
      await page.waitForLoadState('networkidle');

      await employeePage.openAddModal();
      await employeePage.fillEmployeeForm(EMPLOYEE_CREATE_DATA);
      await employeePage.selectPosition();
      await employeePage.selectManager('Admin System');
      await employeePage.submitForm();

      employeeCreated = EMPLOYEE_CREATE_DATA.fullName;

      await employeePage.searchEmployee(employeeCreated);

      log.ok('Employee added successfully');
    } catch (err) {
      log.error('Failed: add employee', err);
      throw err;
    }
  });

  test('Admin can edit employee', async ({ page }, testInfo) => {
    const role = testInfo.project.name;

    if (role !== ROLES.ADMIN) {
      log.warn(`[SKIP] ${role} is not allowed to run this test`);
      return;
    }

    const employeePage = new EmployeesPage(page);

    try {
      await page.goto(`${ENV.baseUrl}${ROUTES.employees}`);
      await page.waitForLoadState('networkidle');

      await employeePage.searchEmployee(employeeCreated);

      await employeePage.clickEditOnRow(EMPLOYEE_CREATE_DATA.code);

      const newName = EMPLOYEE_CREATE_DATA.fullName + ' Edited';

      await employeePage.fullNameInput.fill(newName);
      await employeePage.hireDateInput.fill('2026-05-08');

      await employeePage.submitForm();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5_000);

      await employeePage.searchEmployee(newName);

      await expect(employeePage.tableRows.filter({ hasText: newName })).toBeVisible();

      log.ok('Employee edited successfully');
    } catch (err) {
      log.error('Failed: edit employee', err);
      throw err;
    }
  });
});
