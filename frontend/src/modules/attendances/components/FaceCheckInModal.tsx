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
import { PRIMARY_COLOR } from '@/theme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isCheckOut = action === 'check-out';
  const modalTitle = isCheckOut
    ? t('attendance.faceCheck.modalTitleCheckOut')
    : t('attendance.faceCheck.modalTitleCheckIn');
  const successTitle = isCheckOut
    ? t('attendance.faceCheck.successTitleCheckOut')
    : t('attendance.faceCheck.successTitleCheckIn');
  const failTitle = isCheckOut
    ? t('attendance.faceCheck.failTitleCheckOut')
    : t('attendance.faceCheck.failTitleCheckIn');
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
      notify.error('camera-access-failed', {
        title: t('attendance.faceCheck.cameraAccessFailed'),
        message: error.message || t('attendance.faceCheck.grantCameraPermission'),
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
        const message = t('attendance.faceCheck.noFaceDetectedMessage');
        setVerificationResult({
          status: 'error',
          title: t('attendance.faceCheck.noFaceDetectedTitle'),
          message,
        });
        onResult?.({
          status: 'error',
          message: `${t('attendance.faceCheck.noFaceDetectedTitle')}. ${message}`,
        });
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
      const detail =
        distance && threshold
          ? t('attendance.faceCheck.distanceDetail', { distance, threshold })
          : '';
      const message = detail
        ? t('attendance.faceCheck.faceMatched', { detail })
        : isCheckOut
          ? t('attendance.faceCheck.checkOutRecorded')
          : t('attendance.faceCheck.checkInRecorded');

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
      title={
        <Text fw={700} c={PRIMARY_COLOR} tt="uppercase">
          {modalTitle}
        </Text>
      }
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="xs">{t('attendance.faceCheck.keepFaceCentered')}</Text>
        </Alert>

        {modelsLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                {t('attendance.faceCheck.loadingModels')}
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
                aspectRatio: '4/2',
                transform: 'scaleX(-1)',
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
              {t('attendance.faceCheck.verifyingFace')}
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
                {verificationResult.status === 'success'
                  ? t('attendance.faceCheck.matched')
                  : t('attendance.faceCheck.notMatched')}
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
            {t('common.close')}
          </Button>
          <Button
            leftSection={<IconCamera size={16} />}
            onClick={handleCapture}
            disabled={!cameraReady || loading || capturing}
            loading={loading || capturing}
          >
            {capturing
              ? t('attendance.faceCheck.capturing')
              : isCheckOut
                ? t('attendance.faceCheck.captureCheckOut')
                : t('attendance.faceCheck.captureCheckIn')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
