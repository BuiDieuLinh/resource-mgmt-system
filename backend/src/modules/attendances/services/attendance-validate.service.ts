import { BadRequestException, Injectable } from '@nestjs/common';
import { haversineMeters } from '../utils/checkin-with-face';
import { WorkPolicies } from '@prisma/client';

@Injectable()
export class AttendanceValidationService {
  validateCheckInEligibility(params: {
    normalizedCurrentMinutes: number;
    effectiveStart: number;
    latestCheckInMinutes: number;
    shiftedByLeave: boolean;
    hasCheckedIn: boolean;
  }) {
    const {
      normalizedCurrentMinutes,
      effectiveStart,
      latestCheckInMinutes,
      shiftedByLeave,
      hasCheckedIn,
    } = params;

    if (hasCheckedIn) {
      throw new BadRequestException('Already checked in today');
    }

    if (shiftedByLeave && normalizedCurrentMinutes < effectiveStart) {
      throw new BadRequestException(
        `Check-in is available from ${this.formatScheduleMinute(effectiveStart)} because you have approved leave earlier today`,
      );
    }

    if (normalizedCurrentMinutes > latestCheckInMinutes) {
      throw new BadRequestException(
        `Check-in is not allowed after ${this.formatScheduleMinute(latestCheckInMinutes)}. Current time: ${this.formatScheduleMinute(normalizedCurrentMinutes)}.`,
      );
    }
  }

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

  private formatScheduleMinute(minute: number) {
    const normalized = ((minute % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60)
      .toString()
      .padStart(2, '0');
    const m = (normalized % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
