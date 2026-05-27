import {
  Card,
  Text,
  Group,
  Badge,
  Tooltip,
  Anchor,
  Modal,
  Stack,
  SimpleGrid,
  Image,
  Box,
  ThemeIcon,
  Divider,
  Center,
} from '@mantine/core';
import {
  IconMapPin,
  IconLogin2,
  IconLogout2,
  IconWorld,
  IconDeviceLaptop,
  IconCamera,
  IconShieldCheck,
} from '@tabler/icons-react';
import type { IAttendance, IAttendanceLogs } from '../types';
import { formatMinutes } from '../utils/format';
import { ATTENDANCE_STATUS_COLOR } from '../utils/color';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { PRIMARY_COLOR } from '@/theme';
import { useTranslation } from 'react-i18next';

interface AttendanceDetailModalProps {
  opened: boolean;
  onClose: () => void;
  dayLabel: string;
  record?: IAttendance;
  checkInLog?: IAttendanceLogs;
  checkOutLog?: IAttendanceLogs;
}

function fmtFullTime(value?: string | Date | null) {
  if (!value) return '--:--:--';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtFullDate(value?: string | Date | null) {
  if (!value) return '–';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function parseBrowser(ua?: string | null): string {
  if (!ua) return 'Unknown device';
  const browser = /Edg\/[\d.]+/.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\/[\d.]+/.test(ua)
        ? 'Chrome'
        : /Firefox\/[\d.]+/.test(ua)
          ? 'Firefox'
          : /Safari\/[\d.]+/.test(ua)
            ? 'Safari'
            : 'Browser';
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS') || ua.includes('Macintosh')
      ? 'macOS'
      : ua.includes('Android')
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : ua.includes('Linux')
            ? 'Linux'
            : 'Unknown OS';
  return `${browser} · ${os}`;
}

const fmtMin = (v?: number | null) => {
  if (!v) return '0m';
  return formatMinutes(v);
};

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Badge size="sm" variant="light" color={color ?? 'gray'} radius="sm">
        {value}
      </Badge>
    </Group>
  );
}

function LogCard({ log, variant }: { log?: IAttendanceLogs; variant: 'check_in' | 'check_out' }) {
  const { t } = useTranslation();
  const isCheckIn = variant === 'check_in';
  const accent = isCheckIn ? 'teal' : 'blue';
  const hasGps = log?.latitude != null && log?.longitude != null;

  const { data: address, isLoading: addressLoading } = useReverseGeocode(
    hasGps ? log!.latitude : null,
    hasGps ? log!.longitude : null,
  );

  return (
    <Card withBorder radius="md" p="md" h="100%">
      <Group gap="sm" mb="md" wrap="nowrap">
        <ThemeIcon variant="light" size="lg" radius="md" color={accent}>
          {isCheckIn ? <IconLogin2 size={18} /> : <IconLogout2 size={18} />}
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" fw={500} tt="uppercase">
            {isCheckIn ? t('attendance.detailModal.checkIn') : t('attendance.detailModal.checkOut')}
          </Text>
          <Group gap={6} align="baseline" wrap="nowrap">
            <Text size="lg" fw={700} lh={1.1}>
              {fmtFullTime(log?.timestamp)}
            </Text>
            <Text size="xs" c="dimmed">
              {fmtFullDate(log?.timestamp)}
            </Text>
          </Group>
        </Box>
      </Group>

      <Stack gap={8}>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="subtle" size="sm" color="gray">
            <IconMapPin size={14} />
          </ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}>
            {hasGps ? (
              <Group gap={6} wrap="nowrap" align="flex-start">
                <Tooltip
                  label={address ?? t('attendance.detailModal.noAddressAvailable')}
                  withArrow
                  multiline
                  w={280}
                  disabled={!address}
                >
                  <Text size="xs" style={{ flex: 1, minWidth: 0 }} lineClamp={2}>
                    {addressLoading
                      ? t('attendance.detailModal.resolvingAddress')
                      : (address ?? t('attendance.detailModal.addressUnavailable'))}
                  </Text>
                </Tooltip>
                <Anchor
                  size="xs"
                  href={`https://www.google.com/maps?q=${log!.latitude},${log!.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('attendance.detailModal.map')}
                </Anchor>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                {t('attendance.detailModal.locationNotRecorded')}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="subtle" size="sm" color="gray">
            <IconWorld size={14} />
          </ThemeIcon>
          <Text size="xs" style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}>
            {log?.ip_address ?? '–'}
          </Text>
        </Group>

        <Group gap="xs" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="subtle" size="sm" color="gray">
            <IconDeviceLaptop size={14} />
          </ThemeIcon>
          <Tooltip
            multiline
            w={320}
            label={log?.user_agent ?? t('attendance.detailModal.noDeviceInfo')}
            withArrow
            disabled={!log?.user_agent}
          >
            <Text size="xs" style={{ flex: 1, minWidth: 0 }} truncate>
              {parseBrowser(log?.user_agent)}
            </Text>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}

export function AttendanceDetailModal({
  opened,
  onClose,
  dayLabel,
  record,
  checkInLog,
  checkOutLog,
}: AttendanceDetailModalProps) {
  const { t } = useTranslation();
  const status = record?.status;
  const similarityPct =
    typeof record?.similarity_score === 'number'
      ? Math.round(record.similarity_score * 100 * 10) / 10
      : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius="md"
      centered
      title={
        <Group gap="xs">
          <Text fw={700} c={PRIMARY_COLOR}>
            {t('attendance.detailModal.title')}
          </Text>
          <Badge variant="light" color="gray" radius="sm">
            {dayLabel}
          </Badge>
        </Group>
      }
    >
      <Stack gap="md">
        {/* Summary card */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
                {t('attendance.detailModal.totalWork')}
              </Text>
              <Text fz={28} fw={700} lh={1}>
                {fmtMin(record?.work_minutes)}
              </Text>
            </Box>

            <Stack gap={6} align="flex-end">
              {status && (
                <Badge
                  color={ATTENDANCE_STATUS_COLOR[status] ?? 'gray'}
                  variant="filled"
                  radius="sm"
                  size="md"
                >
                  {status}
                </Badge>
              )}
              {similarityPct != null && (
                <Group gap={4} wrap="nowrap">
                  <IconShieldCheck size={14} color="var(--mantine-color-teal-6)" />
                  <Text size="xs" c="dimmed">
                    {t('attendance.detailModal.faceMatch')}
                  </Text>
                  <Text size="xs" fw={700}>
                    {similarityPct.toFixed(1)}%
                  </Text>
                </Group>
              )}
            </Stack>
          </Group>

          <Divider my="sm" />

          <Group gap="lg" wrap="wrap">
            <StatPill
              label={t('attendance.detailModal.late')}
              value={fmtMin(record?.late)}
              color={record?.late ? 'red' : 'gray'}
            />
            <StatPill
              label={t('attendance.detailModal.earlyLeave')}
              value={fmtMin(record?.early_leave)}
              color={record?.early_leave ? 'yellow' : 'gray'}
            />
            <StatPill
              label={t('attendance.detailModal.overtime')}
              value={fmtMin(record?.overtime)}
              color={record?.overtime ? 'blue' : 'gray'}
            />
          </Group>
        </Card>

        {/* Check-in / Check-out logs */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <LogCard log={checkInLog} variant="check_in" />
          <LogCard log={checkOutLog} variant="check_out" />
        </SimpleGrid>

        {/* Selfie verification — only when image exists */}
        {record?.selfie_image_url && (
          <Card withBorder radius="md" p="md">
            <Group gap="xs" mb="sm" wrap="nowrap">
              <ThemeIcon variant="light" size="sm" color="violet">
                <IconCamera size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                {t('attendance.detailModal.faceVerificationSnapshot')}
              </Text>
              {similarityPct != null && (
                <Badge
                  color="teal"
                  variant="light"
                  size="xs"
                  radius="sm"
                  ml="auto"
                  leftSection={<IconShieldCheck size={11} />}
                >
                  {similarityPct.toFixed(1)}%
                </Badge>
              )}
            </Group>
            <Center>
              <Image
                src={record.selfie_image_url}
                alt={t('attendance.detailModal.checkInSelfie')}
                radius="md"
                mah={260}
                fit="contain"
              />
            </Center>
          </Card>
        )}
      </Stack>
    </Modal>
  );
}
