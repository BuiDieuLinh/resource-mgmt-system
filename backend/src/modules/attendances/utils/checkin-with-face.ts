import { ConfigService } from '@nestjs/config';

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveFaceDistanceThreshold(config: ConfigService): number {
  const configured =
    config.get<string>('FACE_DISTANCE_THRESHOLD') ??
    config.get<string>('FACE_SIMILARITY_THRESHOLD');
  const parsed = configured ? Number(configured) : 0.45;

  if (!Number.isFinite(parsed) || parsed <= 0) return 0.45;

  return Math.min(parsed, 0.45);
}

export function getQuarter(month: number) {
  return Math.floor((month - 1) / 3) + 1;
}

export function resolveQuarterEntitledDays(
  annualLeaveDays: number,
  quarter: number,
) {
  return Number(((annualLeaveDays / 4) * quarter).toFixed(2));
}

export function toSafeFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
