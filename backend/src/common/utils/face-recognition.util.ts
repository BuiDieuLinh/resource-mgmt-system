export function euclideanDistance(
  descriptor1: number[],
  descriptor2: number[],
): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function isValidFaceDescriptor(
  descriptor: unknown,
): descriptor is number[] {
  return (
    Array.isArray(descriptor) &&
    descriptor.length === 128 &&
    descriptor.every(
      (value) => typeof value === 'number' && Number.isFinite(value),
    )
  );
}

export function compareFaces(
  descriptor1: number[],
  descriptor2: number[],
  threshold: number = 0.45,
): { matched: boolean; distance: number } {
  const distance = euclideanDistance(descriptor1, descriptor2);
  return {
    matched: distance <= threshold,
    distance,
  };
}
