import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export type FaceFrameAnalysis = {
  descriptor: Float32Array;
  yawOffset: number;
  faceRatio: number;
};

/**
 * Load face-api.js models from public/models directory
 */
export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = '/models';

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('✅ Face-api.js models loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load face-api.js models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

export async function extractFaceDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<Float32Array | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return detection.descriptor;
  } catch (error) {
    console.error('Error extracting face descriptor:', error);
    return null;
  }
}

export async function analyzeFaceFrame(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<FaceFrameAnalysis | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    const box = detection.detection.box;
    const nose = detection.landmarks.getNose();
    const noseTip = nose[nose.length - 1];
    const yawOffset = (noseTip.x - (box.x + box.width / 2)) / box.width;

    const width =
      'videoWidth' in imageElement && imageElement.videoWidth
        ? imageElement.videoWidth
        : imageElement.width;
    const height =
      'videoHeight' in imageElement && imageElement.videoHeight
        ? imageElement.videoHeight
        : imageElement.height;
    const faceRatio = (box.width * box.height) / (width * height);

    return {
      descriptor: detection.descriptor,
      yawOffset,
      faceRatio,
    };
  } catch (error) {
    console.error('Error analyzing face frame:', error);
    return null;
  }
}

export function averageFaceDescriptors(descriptors: Float32Array[]): Float32Array | null {
  if (descriptors.length === 0) return null;

  const length = descriptors[0].length;
  const average = new Float32Array(length);

  for (const descriptor of descriptors) {
    if (descriptor.length !== length) return null;
    for (let i = 0; i < length; i++) {
      average[i] += descriptor[i];
    }
  }

  for (let i = 0; i < length; i++) {
    average[i] /= descriptors.length;
  }

  return average;
}

export async function validateFaceImage(
  imageElement: HTMLImageElement,
): Promise<{ valid: boolean; message: string }> {
  try {
    const detections = await faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions(),
    );

    if (detections.length === 0) {
      return {
        valid: false,
        message: 'No face detected. Please ensure your face is clearly visible.',
      };
    }

    if (detections.length > 1) {
      return {
        valid: false,
        message: 'Multiple faces detected. Please ensure only one face is in the image.',
      };
    }

    const detection = detections[0];
    const box = detection.box;
    const imageArea = imageElement.width * imageElement.height;
    const faceArea = box.width * box.height;
    const faceRatio = faceArea / imageArea;

    if (faceRatio < 0.05) {
      return {
        valid: false,
        message: 'Face is too small. Please move closer to the camera.',
      };
    }

    return {
      valid: true,
      message: 'Face detected successfully',
    };
  } catch (error) {
    console.error('Error validating face image:', error);
    return {
      valid: false,
      message: 'Error validating image. Please try again.',
    };
  }
}

export function captureCanvasFromVideo(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const maxWidth = 480;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToImageBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.75,
    );
  });
}

export function captureImageFromVideo(video: HTMLVideoElement): string {
  return captureCanvasFromVideo(video).toDataURL('image/jpeg', 0.75);
}

export function euclideanDistance(desc1: Float32Array, desc2: Float32Array): number {
  if (desc1.length !== desc2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}
