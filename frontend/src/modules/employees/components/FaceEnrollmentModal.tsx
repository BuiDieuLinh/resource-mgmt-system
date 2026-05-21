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

interface FaceEnrollmentModalProps {
  opened: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

type EnrollmentPose = {
  label: string;
  hint: string;
  instruction: string;
};

const ENROLLMENT_POSES: EnrollmentPose[] = [
  {
    label: 'Photo 1: Front view',
    hint: 'Keep your face centered and look directly at the camera.',
    instruction: 'Look straight at the camera',
  },
  {
    label: 'Photo 2: Left side',
    hint: 'Turn your face slightly to the left, about 10-15 degrees. Keep both eyes visible.',
    instruction: 'Turn your face slightly left',
  },
  {
    label: 'Photo 3: Right side',
    hint: 'Turn your face slightly to the right, about 10-15 degrees. Keep both eyes visible.',
    instruction: 'Turn your face slightly right',
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
  employeeId,
  employeeName,
}: FaceEnrollmentModalProps) {
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
      notify.error('Failed to load face recognition models', {
        message: error.message || 'Please try again.',
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
        notify.error('Failed to capture image', { message: 'Please try again.' });
        setCapturing(false);
        return;
      }

      // Create an image element to analyze
      const img = document.createElement('img');
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const analysis = await analyzeFaceFrame(img);

      if (!analysis) {
        setValidationStatus('error');
        setValidationMessage(
          'No face detected. Please ensure your face is clearly visible and try again.',
        );
        setCapturing(false);
        return;
      }

      if (analysis.faceRatio < MIN_FACE_RATIO) {
        setValidationStatus('error');
        setValidationMessage('Face is too small. Please move closer to the camera and try again.');
        setCapturing(false);
        return;
      }

      const pose = ENROLLMENT_POSES[activePoseIndex];
      setValidationStatus('success');
      setValidationMessage(`Captured: ${pose.label}`);

      setCapturedImages((current) => [...current, imageSrc]);
      setCapturedDescriptors((current) => {
        const next = [...current, analysis.descriptor];

        if (next.length >= ENROLLMENT_POSES.length) {
          const averageDescriptor = averageFaceDescriptors(next);
          if (averageDescriptor) {
            setFaceDescriptor(averageDescriptor);
            setValidationStatus('success');
            setValidationMessage('All photos captured! Face data is ready to save.');
          }
        } else {
          setActivePoseIndex(next.length);
        }

        return next;
      });
    } catch (error: any) {
      notify.error('Failed to process image', {
        message: error.message || 'Please try again.',
      });
      setValidationStatus('error');
      setValidationMessage('Failed to process the image. Please try again.');
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
      notify.error('No face descriptor', { message: 'No face descriptor to save' });
      return;
    }

    setLoading(true);
    try {
      await useUpdateRegisteredFaceDescriptor().mutateAsync({
        id: employeeId,
        payload: { face_descriptor: Array.from(faceDescriptor) },
      });

      setSaveResult({
        status: 'success',
        title: 'Face registered',
        message: 'Face registered successfully.',
      });
      notify.success('Face registered', { message: 'Face registered successfully!' });
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to register face';
      const isDuplicate = message.toLowerCase().includes('already registered');
      setSaveResult({
        status: 'error',
        title: isDuplicate ? 'Face already registered' : 'Failed to register face',
        message,
      });
      notify.error('Failed to register face', {
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
          REGISTER FACE - {employeeName}
        </Text>
      }
      size="lg"
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Capture 3 photos of your face from different angles. Click the "Capture Photo" button
            for each pose.
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
                  {ENROLLMENT_POSES[activePoseIndex].instruction}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {ENROLLMENT_POSES[activePoseIndex].hint}
                </Text>
              </Alert>
            )}

            {capturedImages.length > 0 && (
              <Box>
                <Text size="sm" fw={700} mb="xs">
                  Captured Photos:
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
              {faceDescriptor ? 'Ready to save' : ENROLLMENT_POSES[activePoseIndex]?.label}
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
              Restart
            </Button>
            <Button variant="default" onClick={handleClose} disabled={loading || capturing}>
              Cancel
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
                Capture Photo
              </Button>
            )}
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleSave}
              disabled={!faceDescriptor || loading}
              loading={loading}
              color="teal"
            >
              Save Face Data
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
