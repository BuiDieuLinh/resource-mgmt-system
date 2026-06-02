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
  Badge,
  Center,
  Loader,
  Image,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCamera,
  IconCheck,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import Webcam from 'react-webcam';
import { notify } from '@/components/Notification';
import { loadFaceApiModels, analyzeFaceFrame, averageFaceDescriptors } from '@/utils/face-api.util';
import { PRIMARY_COLOR } from '@/theme';
import { useUpdateRegisteredFaceDescriptor } from '../api/update-face-descriptor';
import { useTranslation } from 'react-i18next';

interface FaceEnrollmentModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeId: string;
  employeeName: string;
}

type EnrollmentPose = {
  labelKey: string;
  hintKey: string;
  instructionKey: string;
};

const ENROLLMENT_POSES: EnrollmentPose[] = [
  {
    labelKey: 'employee.faceEnrollment.photo1Label',
    hintKey: 'employee.faceEnrollment.photo1Hint',
    instructionKey: 'employee.faceEnrollment.photo1Instruction',
  },
  {
    labelKey: 'employee.faceEnrollment.photo2Label',
    hintKey: 'employee.faceEnrollment.photo2Hint',
    instructionKey: 'employee.faceEnrollment.photo2Instruction',
  },
  {
    labelKey: 'employee.faceEnrollment.photo3Label',
    hintKey: 'employee.faceEnrollment.photo3Hint',
    instructionKey: 'employee.faceEnrollment.photo3Instruction',
  },
];

const MIN_FACE_RATIO = 0.05;

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
};

export function FaceEnrollmentModal({
  opened,
  onClose,
  onSuccess,
  employeeId,
  employeeName,
}: FaceEnrollmentModalProps) {
  const { t } = useTranslation();
  const updateRegisteredFaceDescriptor = useUpdateRegisteredFaceDescriptor();
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activePoseIndex, setActivePoseIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [capturedDescriptors, setCapturedDescriptors] = useState<Float32Array[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'success' | 'error' | null>(null);
  const [saveResult, setSaveResult] = useState<{
    status: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    if (opened) {
      resetEnrollment();
      loadModels();
    }
  }, [opened]);

  const loadModels = async () => {
    setModelsLoading(true);
    try {
      await loadFaceApiModels();
      setModelsLoading(false);
    } catch (error: any) {
      notify.error(t('employee.faceEnrollment.loadModelsFailed'), {
        message: error.message || t('common.tryAgain'),
      });
      setModelsLoading(false);
      handleClose();
    }
  };

  const resetEnrollment = () => {
    setActivePoseIndex(0);
    setCapturedImages([]);
    setCapturedDescriptors([]);
    setCapturing(false);
    setValidationMessage(null);
    setValidationStatus(null);
    setFaceDescriptor(null);
    setSaveResult(null);
  };

  const handleCapture = async () => {
    if (!webcamRef.current || capturing || modelsLoading) return;

    setCapturing(true);
    setValidationMessage(null);
    setValidationStatus(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        notify.error(t('employee.faceEnrollment.captureFailed'), {
          message: t('common.tryAgain'),
        });
        setCapturing(false);
        return;
      }

      const img = document.createElement('img');
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const analysis = await analyzeFaceFrame(img);

      if (!analysis) {
        setValidationStatus('error');
        setValidationMessage(t('employee.faceEnrollment.noFaceDetected'));
        setCapturing(false);
        return;
      }

      if (analysis.faceRatio < MIN_FACE_RATIO) {
        setValidationStatus('error');
        setValidationMessage(t('employee.faceEnrollment.faceTooSmall'));
        setCapturing(false);
        return;
      }

      const pose = ENROLLMENT_POSES[activePoseIndex];
      setValidationStatus('success');
      setValidationMessage(
        t('employee.faceEnrollment.capturedPose', {
          pose: t(pose.labelKey),
        }),
      );

      setCapturedImages((current) => [...current, imageSrc]);
      setCapturedDescriptors((current) => {
        const next = [...current, analysis.descriptor];

        if (next.length >= ENROLLMENT_POSES.length) {
          const averageDescriptor = averageFaceDescriptors(next);
          if (averageDescriptor) {
            setFaceDescriptor(averageDescriptor);
            setValidationStatus('success');
            setValidationMessage(t('employee.faceEnrollment.readyToSave'));
          }
        } else {
          setActivePoseIndex(next.length);
        }

        return next;
      });
    } catch (error: any) {
      notify.error(t('employee.faceEnrollment.processFailed'), {
        message: error.message || t('common.tryAgain'),
      });
      setValidationStatus('error');
      setValidationMessage(t('employee.faceEnrollment.processFailed'));
    } finally {
      setCapturing(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setCapturedImages((current) => current.filter((_, i) => i !== index));
    setCapturedDescriptors((current) => current.filter((_, i) => i !== index));
    setActivePoseIndex(Math.max(0, activePoseIndex - 1));
    setFaceDescriptor(null);
    setValidationMessage(null);
    setValidationStatus(null);
  };

  const handleReset = () => {
    resetEnrollment();
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!faceDescriptor) {
      notify.error(t('employee.faceEnrollment.noDescriptorTitle'), {
        message: t('employee.faceEnrollment.noDescriptorMessage'),
      });
      return;
    }

    setLoading(true);
    try {
      await updateRegisteredFaceDescriptor.mutateAsync({
        id: employeeId,
        payload: { face_descriptor: Array.from(faceDescriptor) },
      });

      setSaveResult({
        status: 'success',
        title: t('employee.faceEnrollment.faceRegistered'),
        message: t('employee.faceEnrollment.faceRegisteredSuccess'),
      });
      notify.success(t('employee.faceEnrollment.faceRegistered'), {
        message: t('employee.faceEnrollment.faceRegisteredSuccess'),
      });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('employee.faceEnrollment.registerFailed');
      const isDuplicate = message.toLowerCase().includes('already registered');
      setSaveResult({
        status: 'error',
        title: isDuplicate
          ? t('employee.faceEnrollment.faceAlreadyRegistered')
          : t('employee.faceEnrollment.registerFailed'),
        message,
      });
      notify.error(t('employee.faceEnrollment.registerFailed'), {
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (capturedDescriptors.length / ENROLLMENT_POSES.length) * 100;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {t('employee.faceEnrollment.title', { name: employeeName })}
        </Text>
      }
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm">{t('employee.faceEnrollment.description')}</Text>
        </Alert>

        {modelsLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                {t('employee.faceEnrollment.loadingModels')}
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Box pos="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: '#000',
                  aspectRatio: '4/3',
                  transform: 'scaleX(-1)',
                }}
              />
            </Box>

            {!faceDescriptor && activePoseIndex < ENROLLMENT_POSES.length && (
              <Alert icon={<IconCamera size={16} />} color="indigo" variant="light">
                <Text size="sm" fw={700}>
                  {t(ENROLLMENT_POSES[activePoseIndex].instructionKey)}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {t(ENROLLMENT_POSES[activePoseIndex].hintKey)}
                </Text>
              </Alert>
            )}

            {capturedImages.length > 0 && (
              <Box>
                <Text size="sm" fw={700} mb="xs">
                  {t('employee.faceEnrollment.capturedPhotos')}
                </Text>
                <Group gap="sm">
                  {capturedImages.map((img, index) => (
                    <Box key={index} pos="relative">
                      <Image
                        src={img}
                        alt={`Captured ${index + 1}`}
                        w={100}
                        h={75}
                        fit="cover"
                        radius="sm"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <Button
                        size="xs"
                        color="red"
                        variant="filled"
                        pos="absolute"
                        top={4}
                        right={4}
                        p={4}
                        onClick={() => handleDeletePhoto(index)}
                        disabled={loading || capturing}
                        style={{ minWidth: 'auto', height: 'auto' }}
                      >
                        <IconTrash size={12} />
                      </Button>
                      <Badge size="xs" pos="absolute" bottom={4} left={4} variant="filled">
                        {index + 1}
                      </Badge>
                    </Box>
                  ))}
                </Group>
              </Box>
            )}
          </>
        )}

        <Box>
          <Group justify="space-between" mb={6}>
            <Text size="sm" fw={700}>
              {faceDescriptor
                ? t('employee.faceEnrollment.readyToSaveShort')
                : t(ENROLLMENT_POSES[activePoseIndex]?.labelKey ?? '')}
            </Text>
            <Badge color={faceDescriptor ? 'teal' : capturing ? 'blue' : 'gray'}>
              {capturedDescriptors.length}/{ENROLLMENT_POSES.length}
            </Badge>
          </Group>
          <Progress value={progress} animated={!faceDescriptor} />
        </Box>

        {validationMessage && (
          <Alert
            icon={
              validationStatus === 'success' ? (
                <IconCheck size={16} />
              ) : (
                <IconAlertCircle size={16} />
              )
            }
            color={
              validationStatus === 'success'
                ? 'teal'
                : validationStatus === 'error'
                  ? 'red'
                  : 'blue'
            }
            variant="light"
          >
            {validationMessage}
          </Alert>
        )}

        {saveResult && (
          <Alert
            icon={
              saveResult.status === 'success' ? (
                <IconCheck size={16} />
              ) : (
                <IconAlertCircle size={16} />
              )
            }
            color={saveResult.status === 'success' ? 'teal' : 'red'}
            variant="light"
          >
            <Text size="sm" fw={700}>
              {saveResult.title}
            </Text>
            <Text size="sm">{saveResult.message}</Text>
          </Alert>
        )}

        <Group justify="space-between" mt="md">
          <Group>
            <Button
              variant="subtle"
              onClick={handleReset}
              disabled={loading || modelsLoading || capturing}
              leftSection={<IconRefresh size={16} />}
            >
              {t('employee.faceEnrollment.restart')}
            </Button>
            <Button variant="default" onClick={handleClose} disabled={loading || capturing}>
              {t('common.cancel')}
            </Button>
          </Group>
          <Group>
            {!faceDescriptor && activePoseIndex < ENROLLMENT_POSES.length && (
              <Button
                leftSection={<IconCamera size={16} />}
                onClick={handleCapture}
                disabled={modelsLoading || capturing}
                loading={capturing}
              >
                {t('employee.faceEnrollment.capturePhoto')}
              </Button>
            )}
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleSave}
              disabled={!faceDescriptor || loading}
              loading={loading}
              color="teal"
            >
              {t('employee.faceEnrollment.saveFaceData')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
