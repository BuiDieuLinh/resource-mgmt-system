import { ENV, type Role } from '../common/env';
import { log } from '../common/logger';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pom/LoginPage';

export interface TokenResponse {
  access_token: string;
  user: { id: string; email: string; roles: string[] };
  is_first_login: boolean;
}

const AUTH_DIR = path.join(__dirname, '../playwright/.auth');

function getTokenFromStorageFile(role: Role): string | null {
  try {
    const authFile = path.join(AUTH_DIR, `${role}.json`);
    if (!fs.existsSync(authFile)) return null;

    const content = fs.readFileSync(authFile, 'utf-8');
    const storageState = JSON.parse(content);
    const token = storageState.origins?.[0]?.localStorage?.find(
      (i: any) => i.name === 'access_token',
    )?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  log.step(`Login API: ${email}`);
  const res = await fetch(`${ENV.authUrl!.replace(/\/$/, '')}auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login failed for ${email}: ${err?.message ?? res.statusText}`);
  }

  const json = await res.json();
  log.ok(`Login success: ${email} → roles: ${json.data.user.roles.join(', ')}`);
  return json.data as TokenResponse;
}

export async function getTokenForRole(role: Role): Promise<string> {
  const fileToken = getTokenFromStorageFile(role);
  if (fileToken) {
    log.info(`Token loaded from storage file for ${role}`);
    return fileToken;
  }

  log.info(`Storage file not found for ${role} — logging in`);
  const creds = ENV[role];
  const { access_token } = await loginApi(creds.email, creds.password);
  return access_token;
}
