import { apiCall } from './client';
import { log } from '../common/logger';

export interface CyclePayload {
  title: string;
  period_type: 'monthly' | 'quarterly';
  period_year: number;
  period_seq: number;
  announce_date: string;
}

export interface ReviewCycle extends CyclePayload {
  id: string;
}

export async function ensureCycle(payload: CyclePayload, token: string): Promise<ReviewCycle> {
  log.step(`Ensure review cycle: ${payload.title}`);

  const list = await apiCall<any>('performance/cycles', { token });
  const existing = (list.data as any)?.find(
    (c: ReviewCycle) =>
      c.period_type === payload.period_type &&
      c.period_year === payload.period_year &&
      c.period_seq === payload.period_seq,
  );

  if (existing) {
    log.info(`Cycle already exists: ${existing.id}`);
    return existing;
  }

  const res = await apiCall<ReviewCycle>('performance/cycles', {
    method: 'POST',
    body: payload,
    token,
  });
  log.ok(`Cycle created: ${(res.data as any).id}`);
  return res.data as ReviewCycle;
}
