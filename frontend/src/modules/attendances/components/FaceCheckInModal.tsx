import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Stack,
  Button,
  Text,
  Alert,
  Group,
  Box,
  Progress,
  Center,
  Loader,
  Badge,
} from '@mantine/core';
import { IconAlertCircle, IconCamera, IconX } from '@tabler/icons-react';
import { notify } from '@/components/Notification';
import {
  loadFaceApiModels,
  extractFaceDescriptor,
  captureCanvasFromVideo,
  canvasToImageBlob,
} from '@/utils/face-api.util';
import { apiClient } from '@/lib/api';

interface FaceCheckInModalProps {
  opened: boolean;
  onClose: () => void;
  employeeId: string;
  onSuccess: () => void;
  onResult?: (result: { status: 'success' | 'error'; message: string }) => void;
  latitude?: number;
  longitude?: number;
}

export function FaceCheckInModal({
  opened,
  onClose,
  employeeId,
  onSuccess,
  onResult,
  latitude,
  longitude,
}: FaceCheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'error';
    title: string;
    message: string;
    detail?: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (opened) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [opened]);

  const initializeCamera = async () => {
    setModelsLoading(true);
    setVerificationResult(null);
    try {
      // Load models
      await loadFaceApiModels();
      setModelsLoading(false);

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (error: any) {
      notify.error('Camera access failed', {
        message: error.message || 'Please grant camera permission.',
      });
      setModelsLoading(false);
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !cameraReady) return;

    setCapturing(true);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    setLoading(true);

    try {
      const selfieCanvas = captureCanvasFromVideo(videoRef.current);

      const descriptor = await extractFaceDescriptor(selfieCanvas);
      if (!descriptor) {
        const message = 'Please ensure your face is clearly visible and try again.';
        setVerificationResult({
          status: 'error',
          title: 'No face detected',
          message,
        });
        onResult?.({ status: 'error', message: `No face detected. ${message}` });
        setLoading(false);
        setCapturing(false);
        return;
      }

      const selfieBlob = await canvasToImageBlob(selfieCanvas);
      const formData = new FormData();
      formData.append('employee_id', employeeId);
      formData.append('timestamp', new Date().toISOString());
      formData.append('face_descriptor', JSON.stringify(Array.from(descriptor)));
      formData.append('selfie', selfieBlob, 'check-in-selfie.jpg');
      if (latitude != null) formData.append('latitude', String(latitude));
      if (longitude != null) formData.append('longitude', String(longitude));

      const response = await apiClient.post('/attendances/check-in/face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data?.data;
      const distance =
        typeof data?.face_distance === 'number' ? data.face_distance.toFixed(3) : null;
      const threshold =
        typeof data?.face_threshold === 'number' ? data.face_threshold.toFixed(2) : null;
      const detail = distance && threshold ? `Distance ${distance} / threshold ${threshold}` : '';
      const message = detail
        ? `Face matched. ${detail}.`
        : 'Face matched and check-in was recorded.';

      setVerificationResult({
        status: 'success',
        title: 'Check-in successful',
        message,
        detail,
      });
      stopCamera();
      onSuccess();
      onResult?.({ status: 'success', message });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Check-in failed';
      setVerificationResult({
        status: 'error',
        title: 'Check-in failed',
        message: errorMsg,
      });
      onResult?.({ status: 'error', message: errorMsg });
      notify.error('Check-in failed', { message: errorMsg });
      setLoading(false);
      setCapturing(false);
    } finally {
      setLoading(false);
      setCapturing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Face Verification Check-In"
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            <strong>Instructions:</strong>
            <br />• Position your face in the center of the frame
            <br />• Look straight at the camera
            <br />• Ensure good lighting
            <br />• Remove mask or sunglasses
          </Text>
        </Alert>

        {modelsLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                Loading face recognition models...
              </Text>
            </Stack>
          </Center>
        ) : (
          <Box pos="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                borderRadius: 8,
                backgroundColor: '#000',
                aspectRatio: '4/3',
              }}
            />

            {countdown !== null && (
              <Box
                pos="absolute"
                top="50%"
                left="50%"
                style={{
                  transform: 'translate(-50%, -50%)',
                  fontSize: 120,
                  fontWeight: 800,
                  color: 'white',
                  textShadow: '0 0 20px rgba(0,0,0,0.8)',
                }}
              >
                {countdown}
              </Box>
            )}

            {!cameraReady && !modelsLoading && (
              <Box
                pos="absolute"
                top="50%"
                left="50%"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <Loader size="lg" />
              </Box>
            )}
          </Box>
        )}

        {loading && (
          <Box>
            <Text size="sm" mb="xs">
              Verifying face...
            </Text>
            <Progress value={100} animated />
          </Box>
        )}

        {verificationResult && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color={verificationResult.status === 'success' ? 'teal' : 'red'}
            variant="light"
          >
            <Group justify="space-between" align="flex-start" gap="sm">
              <Box>
                <Text size="sm" fw={700}>
                  {verificationResult.title}
                </Text>
                <Text size="sm">{verificationResult.message}</Text>
              </Box>
              <Badge color={verificationResult.status === 'success' ? 'teal' : 'red'}>
                {verificationResult.status === 'success' ? 'Matched' : 'Not matched'}
              </Badge>
            </Group>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onClose}
            disabled={loading || capturing}
            leftSection={<IconX size={16} />}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconCamera size={16} />}
            onClick={handleCapture}
            disabled={!cameraReady || loading || capturing}
            loading={loading || capturing}
          >
            {capturing ? 'Capturing...' : 'Capture & Check In'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
