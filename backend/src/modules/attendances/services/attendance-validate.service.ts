import { BadRequestException, Injectable } from '@nestjs/common';
import { haversineMeters } from '../utils/checkin-with-face';
import { WorkPolicies } from '@prisma/client';

@Injectable()
export class AttendanceValidationService {
  validateGps(policy: WorkPolicies, latitude?: number, longitude?: number) {
    if (
      policy?.office_latitude != null &&
      policy?.office_longitude != null &&
      latitude != null &&
      longitude != null
    ) {
      const dist = haversineMeters(
        Number(latitude),
        Number(longitude),
        Number(policy.office_latitude),
        Number(policy.office_longitude),
      );

      const maxDist = policy.max_distance_meters ?? 100;

      if (dist > maxDist) {
        throw new BadRequestException(
          `You are too far from the office (${Math.round(dist)}m away, max ${maxDist}m allowed)`,
        );
      }
    } else if (
      policy?.office_latitude != null &&
      (latitude == null || longitude == null)
    ) {
      throw new BadRequestException('GPS location is required for check-in');
    }
  }
}
