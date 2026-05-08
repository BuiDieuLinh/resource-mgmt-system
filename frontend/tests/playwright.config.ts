import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,

  globalSetup: './global-setup.ts',

  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'https://frontend-staging-0655.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    geolocation: {
      latitude: parseFloat(process.env.OFFICE_LATITUDE || '21.027763'),
      longitude: parseFloat(process.env.OFFICE_LONGITUDE || '105.834160'),
    },
    permissions: ['geolocation'],
  },

  projects: [
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      testMatch: '**/*.spec.ts',
    },

    {
      name: 'manager',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/manager.json',
      },
      testMatch: '**/*.spec.ts',
    },

    {
      name: 'employee',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/employee.json',
      },
      testMatch: '**/*.spec.ts',
    },

    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.spec.ts',
    },
  ],
});
