import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  compareFaces,
  isValidFaceDescriptor,
} from 'src/common/utils/face-recognition.util';
import { resolveFaceDistanceThreshold } from '../utils/checkin-with-face';

@Injectable()
export class FaceVerificationService {
  constructor(private config: ConfigService) {}

  verify(registeredDescriptor: number[], capturedDescriptor: number[]) {
    if (!isValidFaceDescriptor(registeredDescriptor)) {
      throw new BadRequestException('No face descriptor registered');
    }

    if (!isValidFaceDescriptor(capturedDescriptor)) {
      throw new BadRequestException('Invalid face descriptor');
    }

    const threshold = resolveFaceDistanceThreshold(this.config);

    const comparison = compareFaces(
      registeredDescriptor,
      capturedDescriptor,
      threshold,
    );

    if (!comparison.matched) {
      throw new BadRequestException(
        `Face verification failed. Distance: ${comparison.distance.toFixed(3)}`,
      );
    }

    return {
      threshold,
      comparison,
      similarity: 1 - comparison.distance,
    };
  }
}
