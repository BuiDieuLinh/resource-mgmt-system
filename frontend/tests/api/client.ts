import { ENV } from '../common/env';
import { log } from '../common/logger';

export interface ApiResponse<T = unknown> {
  data: T;
  error: boolean;
  message: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  retries?: number;
}

const RETRY_ON_STATUS = new Set([429, 502, 503, 504]);

export async function apiCall<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token, retries = 3 } = options;
  if (!ENV.apiUrl) {
    throw new Error('ENV.apiUrl is not defined. Make sure .env exists and is loaded.');
  }
  const url = `${ENV.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let attempt = 0;
  while (attempt <= retries) {
    attempt++;
    log.info(`API ${method} ${url} (attempt ${attempt})`);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (RETRY_ON_STATUS.has(res.status) && attempt <= retries) {
      log.warn(`Status ${res.status} — retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      log.error(`API error ${res.status}: ${json?.message ?? res.statusText}`);
      throw new Error(
        `API ${method} ${url} failed [${res.status}]: ${json?.message ?? res.statusText}`,
      );
    }

    log.ok(`API ${method} ${url} → ${res.status}`);
    return json as ApiResponse<T>;
  }

  throw new Error(`API ${method} ${url} failed after ${retries} retries`);
}
