import { test, expect } from '@playwright/test';
import { getTokenForRole } from '../../api/auth.api';
import { ensureEmployee, getPositions, findEmployeeByName } from '../../api/employees.api';
import { log } from '../../common/logger';
import { makeEmployeePayload } from '../../data/test-data';
import { ROUTES } from '../../common/routes';
import { ENV, ROLES } from '../../common/env';

const EMPLOYEE_TEST = '[Auto-Test] Employee View';

let adminToken: string;
let profileEmployeeId: string;

test.describe('Employee Profile - Admin Access', () => {
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test.beforeEach(async ({ page }) => {
    adminToken = await getTokenForRole(ROLES.ADMIN);

    const existing = await findEmployeeByName(EMPLOYEE_TEST, adminToken);
    if (existing.count > 0) {
      log.info(`Employee ${EMPLOYEE_TEST} already exists — reusing`);
      profileEmployeeId = existing.data[0].id;
      return;
    } else {
      log.info(`Employee ${EMPLOYEE_TEST} not found — creating new one`);
      const positions = await getPositions(adminToken);
      if (!positions.length) throw new Error('No positions found — run seed first');

      const manager = await findEmployeeByName('Admin System', adminToken);
      if (!manager) throw new Error('Manager employee not found — run seed first');

      const emp = await ensureEmployee(
        makeEmployeePayload(EMPLOYEE_TEST, positions[0].id, manager.data[0].id),
        adminToken,
      );
      profileEmployeeId = emp.id;
      log.ok('beforeAll: CRUD test data ready');
    }
  });
  test('View employee profile page', async ({ page }) => {
    log.step('Test: admin can view employee profile');

    if (ROLES.ADMIN && ROLES.MANAGER) {
      try {
        await page.goto(`${ENV.baseUrl}${ROUTES.employeeProfile(profileEmployeeId)}`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByText(EMPLOYEE_TEST).nth(1)).toBeVisible();
        await expect(page.getByText(/personal information/i)).toBeVisible();
        await expect(page.getByText(/work information/i)).toBeVisible();
        log.ok('Employee profile page loaded');
      } catch (err) {
        log.error('Failed: view employee profile', err);
        throw err;
      }
    } else {
      await expect(page.getByText('You do not have permission to view this profile')).toBeVisible();
    }
  });

  test('Admin can view org chart', async ({ page }) => {
    log.step('Test: admin can view org chart');
    if (ROLES.EMPLOYEE) return;

    try {
      await page.goto(`${ENV.baseUrl}${ROUTES.orgChart}`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/organization chart/i)).toBeVisible();
      await expect(page.getByText(EMPLOYEE_TEST)).toBeVisible();
      log.ok('Org chart page loaded');
    } catch (err) {
      log.error('Failed: view org chart', err);
      throw err;
    }
  });
});
