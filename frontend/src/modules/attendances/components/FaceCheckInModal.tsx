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
import { useFaceCheckIn, useFaceCheckOut } from '../api/face-check';

interface FaceCheckInModalProps {
  opened: boolean;
  onClose: () => void;
  employeeId: string;
  onSuccess: () => void;
  onResult?: (result: { status: 'success' | 'error'; message: string }) => void;
  latitude?: number;
  longitude?: number;
  action?: 'check-in' | 'check-out';
}

export function FaceCheckInModal({
  opened,
  onClose,
  employeeId,
  onSuccess,
  onResult,
  latitude,
  longitude,
  action = 'check-in',
}: FaceCheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const isCheckOut = action === 'check-out';
  const modalTitle = isCheckOut ? 'Face Verification Check-Out' : 'Face Verification Check-In';
  const successTitle = isCheckOut ? 'Check-out successful' : 'Check-in successful';
  const failTitle = isCheckOut ? 'Check-out failed' : 'Check-in failed';
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
  const faceCheckInMutation = useFaceCheckIn();
  const faceCheckOutMutation = useFaceCheckOut();
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
      formData.append('selfie', selfieBlob, 'face-selfie.jpg');
      if (latitude != null) formData.append('latitude', String(latitude));
      if (longitude != null) formData.append('longitude', String(longitude));

      const response = await (isCheckOut
        ? faceCheckOutMutation.mutateAsync(formData)
        : faceCheckInMutation.mutateAsync(formData));

      const data = response.data;
      const distance =
        typeof data?.face_distance === 'number' ? data.face_distance.toFixed(3) : null;
      const threshold =
        typeof data?.face_threshold === 'number' ? data.face_threshold.toFixed(2) : null;
      const detail = distance && threshold ? `Distance ${distance} / threshold ${threshold}` : '';
      const message = detail
        ? `Face matched. ${detail}.`
        : `${action === 'check-out' ? 'Check-out' : 'Check-in'} was recorded successfully.`;

      setVerificationResult({
        status: 'success',
        title: successTitle,
        message,
        detail,
      });
      stopCamera();
      onSuccess();
      onResult?.({ status: 'success', message });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || failTitle;
      setVerificationResult({
        status: 'error',
        title: failTitle,
        message: errorMsg,
      });
      onResult?.({ status: 'error', message: errorMsg });
      notify.error(failTitle, { message: errorMsg });
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
      title={modalTitle}
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Keep your face centered, well lit and still until the capture completes.
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
            Close
          </Button>
          <Button
            leftSection={<IconCamera size={16} />}
            onClick={handleCapture}
            disabled={!cameraReady || loading || capturing}
            loading={loading || capturing}
          >
            {capturing ? 'Capturing...' : isCheckOut ? 'Capture & Check Out' : 'Capture & Check In'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
