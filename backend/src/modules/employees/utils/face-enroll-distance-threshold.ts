import { ConfigService } from '@nestjs/config';

export function resolveFaceEnrollmentDistanceThreshold(
  config: ConfigService,
): number {
  const configured =
    config.get<string>('FACE_DISTANCE_THRESHOLD') ??
    config.get<string>('FACE_SIMILARITY_THRESHOLD');
  const parsed = configured ? Number(configured) : 0.45;

  if (!Number.isFinite(parsed) || parsed <= 0) return 0.45;
  return Math.min(parsed, 0.45);
}
