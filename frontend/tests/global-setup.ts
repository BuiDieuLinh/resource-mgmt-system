import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '.env') });

import { log } from './common/logger';
import { ENV, type Role } from './common/env';
import { LoginPage } from './pom/LoginPage';
import { AppLauncher } from './pom/AppLauncher';

interface RoleConfig {
  role: Role;
  email: string;
  password: string;
  file: string;
}

const ROLES: RoleConfig[] = [
  { role: 'admin', email: ENV.admin.email!, password: ENV.admin.password!, file: 'admin.json' },
  {
    role: 'manager',
    email: ENV.manager.email!,
    password: ENV.manager.password!,
    file: 'manager.json',
  },
  {
    role: 'employee',
    email: ENV.employee.email!,
    password: ENV.employee.password!,
    file: 'employee.json',
  },
];

const AUTH_DIR = path.join(__dirname, 'playwright/.auth');

async function loginAndSaveSession(config: FullConfig, roleConfig: RoleConfig): Promise<void> {
  const { role, email, password, file } = roleConfig;
  const authFile = path.join(AUTH_DIR, file);

  if (fs.existsSync(authFile)) {
    const age = Date.now() - fs.statSync(authFile).mtimeMs;
    if (age < 30 * 60 * 1000) {
      log.info(`[${role}] Session still fresh (${Math.round(age / 1000)}s old) — skipping login`);
      return;
    }
  }

  log.step(`[${role}] Logging in as ${email}`);

  const baseURL = config.projects[0]?.use?.baseURL ?? ENV.baseUrl!;
  const authUrl = ENV.authUrl || baseURL;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
  });
  const page = await context.newPage();

  try {
    await page.goto(authUrl);
    log.info(`[${role}] Navigated to auth URL`);

    const loginPage = new LoginPage(page);
    const appLauncher = new AppLauncher(page);
    await loginPage.login(email, password);
    log.info(`[${role}] Login form submitted`);

    await page.waitForLoadState('networkidle');
    const appPage = await appLauncher.launchRMS();

    const tokenHandle = await appPage.waitForFunction(
      () => {
        return window.localStorage.getItem('access_token');
      },
      null,
      { timeout: 30_000 },
    );
    const token = tokenHandle ? await tokenHandle.jsonValue() : null;
    if (!token) {
      throw new Error(`[${role}] access_token not found in localStorage after UI login`);
    }
    log.ok(`[${role}] Token persisted in app localStorage`);

    fs.mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({ path: authFile });
    log.ok(`[${role}] Session saved → ${authFile}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`[${role}] Login failed: ${msg}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  log.step('=== Global Setup: Login all roles via UI and save session ===');

  await Promise.all(ROLES.map((roleConfig) => loginAndSaveSession(config, roleConfig)));

  log.ok('=== Global Setup complete — all sessions ready ===');
}
