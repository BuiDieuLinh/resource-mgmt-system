import { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Text,
  Button,
  Group,
  Badge,
  ThemeIcon,
  Alert,
  Loader,
  Grid,
  Skeleton,
  Box,
  RingProgress,
} from '@mantine/core';
import {
  IconMapPin,
  IconLogin,
  IconLogout,
  IconAlertCircle,
  IconCircleCheck,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { notify } from '@/components/Notification';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useGetActivePolicy } from '@/modules/work-policies/api/get-work-policies';
import { useCheckIn, useCheckOut } from '../api/check-in-out';
import { useGetTodayAttendance } from '../api/get-today-attendance';
import { useGPS } from '@/hooks/useGPS';
import { minutesToTime } from '@/constant';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'vi' } },
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

export default function CheckInOutPage() {
  const now = useNow();
  const { user } = useAuthStore();
  const { data: empData } = useGetEmployeeByUserId(user?.id);
  const employee = empData?.data;
  const { data: policyData } = useGetActivePolicy();
  const policy = policyData?.data;
  const schedule = employee?.work_schedules?.[0];

  const { data: todayData, refetch: refetchToday } = useGetTodayAttendance(employee?.id);
  const todayRecord = todayData?.data;

  // Derive state from today's record
  const hasCheckedIn = !!todayRecord?.check_in_time;
  const hasCheckedOut = !!todayRecord?.check_out_time;
  const checkInTime = todayRecord?.check_in_time ? new Date(todayRecord.check_in_time) : null;

  const { position, loading: gpsLoading, error: gpsError, getPosition } = useGPS();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    getPosition()
      .then(async (gps) => {
        setAddressLoading(true);
        setAddress(await reverseGeocode(gps.latitude, gps.longitude));
        setAddressLoading(false);
      })
      .catch(() => {});
  }, []);

  const hasOfficeLocation = policy?.office_latitude != null && policy?.office_longitude != null;
  const maxDist = policy?.max_distance_meters ?? 100;
  const distanceToOffice =
    hasOfficeLocation && position
      ? haversineMeters(
          position.latitude,
          position.longitude,
          Number(policy!.office_latitude),
          Number(policy!.office_longitude),
        )
      : null;
  const withinRange = distanceToOffice != null ? distanceToOffice <= maxDist : true;
  const canAct = !(!withinRange && hasOfficeLocation);

  const handleCheckIn = async () => {
    if (!employee) return;
    const notiId = notify.loading('Checking in...');
    try {
      const gps = await getPosition();
      await checkInMutation.mutateAsync({
        employee_id: employee.id,
        latitude: gps.latitude,
        longitude: gps.longitude,
        timestamp: new Date().toISOString(),
      });
      await refetchToday();
      notify.success(notiId, { message: 'Checked in successfully!' });
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || e?.message || 'Check-in failed',
      });
    }
  };

  const handleCheckOut = async () => {
    if (!employee) return;
    const notiId = notify.loading('Checking out...');
    try {
      const gps = await getPosition();
      await checkOutMutation.mutateAsync({
        employee_id: employee.id,
        latitude: gps.latitude,
        longitude: gps.longitude,
        timestamp: new Date().toISOString(),
      });
      await refetchToday();
      notify.success(notiId, { message: 'Checked out successfully!' });
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || e?.message || 'Check-out failed',
      });
    }
  };

  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const workStart = schedule?.start_time ?? 480;
  const workEnd = schedule?.end_time ?? 1020;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const workProgress = Math.min(
    100,
    Math.max(0, ((nowMin - workStart) / (workEnd - workStart)) * 100),
  );

  // Gradient: idle=slate-blue, working=teal, done=gray
  const gradient = hasCheckedOut
    ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)'
    : hasCheckedIn
      ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 60%, #0f766e 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #4f46e5 100%)';

  const statusLabel = hasCheckedOut
    ? 'Done for today'
    : hasCheckedIn
      ? 'Currently working'
      : 'Not checked in';
  const statusColor = hasCheckedOut ? '#94a3b8' : hasCheckedIn ? '#5eead4' : '#93c5fd';

  return (
    <Stack gap="md">
      <PageHeader
        title="Check In / Out"
        description="Record your attendance with GPS verification"
      />

      <Grid gutter="md" align="stretch">
        {/* ── Left: Hero clock card ── */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card
            radius="xl"
            p={0}
            style={{
              background: gradient,
              overflow: 'hidden',
              minHeight: 420,
              transition: 'background 0.8s ease',
            }}
          >
            <Stack gap={0} h="100%">
              <Box p="xl" style={{ flex: 1 }}>
                <Stack align="center" gap="md">
                  <Badge
                    size="sm"
                    radius="xl"
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      color: 'white',
                      border: `1px solid ${statusColor}40`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ color: statusColor, marginRight: 6 }}>●</span>
                    {statusLabel}
                  </Badge>

                  <Text
                    style={{
                      fontSize: '3.8rem',
                      fontWeight: 800,
                      color: 'white',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-2px',
                      textShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    {timeStr}
                  </Text>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {dateStr}
                  </Text>

                  {hasCheckedIn && checkInTime && (
                    <Group
                      gap={6}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 20,
                        padding: '4px 14px',
                      }}
                    >
                      <IconCircleCheck size={15} color="white" />
                      <Text size="xs" style={{ color: 'white' }}>
                        In at{' '}
                        {checkInTime.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {hasCheckedOut && todayRecord?.check_out_time && (
                        <>
                          <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            ·
                          </Text>
                          <Text size="xs" style={{ color: 'white' }}>
                            Out at{' '}
                            {new Date(todayRecord.check_out_time).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </>
                      )}
                    </Group>
                  )}
                </Stack>
              </Box>

              {/* Progress bar */}
              {schedule && (
                <Box px="xl" pb="md">
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {minutesToTime(workStart)}
                    </Text>
                    <Text size="xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {minutesToTime(workEnd)}
                    </Text>
                  </Group>
                  <Box
                    style={{
                      height: 4,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      style={{
                        height: '100%',
                        width: `${workProgress}%`,
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 2,
                        transition: 'width 1s linear',
                      }}
                    />
                  </Box>
                  {policy?.break_start != null && policy?.break_end != null && (
                    <Text size="xs" ta="center" mt={4} style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Break {minutesToTime(policy.break_start)} – {minutesToTime(policy.break_end)}
                    </Text>
                  )}
                </Box>
              )}

              {/* Buttons */}
              <Box p="xl" pt={0}>
                <Group grow gap="sm">
                  <Button
                    size="md"
                    radius="xl"
                    leftSection={<IconLogin size={18} />}
                    disabled={hasCheckedIn || checkInMutation.isPending || !canAct}
                    loading={checkInMutation.isPending}
                    onClick={handleCheckIn}
                    style={{
                      background: hasCheckedIn
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.95)',
                      color: hasCheckedIn ? 'rgba(255,255,255,0.3)' : '#3b82f6',
                      border: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Check In
                  </Button>
                  <Button
                    size="md"
                    radius="xl"
                    leftSection={<IconLogout size={18} />}
                    disabled={
                      !hasCheckedIn || hasCheckedOut || checkOutMutation.isPending || !canAct
                    }
                    loading={checkOutMutation.isPending}
                    onClick={handleCheckOut}
                    style={{
                      background:
                        !hasCheckedIn || hasCheckedOut
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.2)',
                      color: !hasCheckedIn || hasCheckedOut ? 'rgba(255,255,255,0.3)' : 'white',
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontWeight: 700,
                    }}
                  >
                    Check Out
                  </Button>
                </Group>
                {hasOfficeLocation && !withinRange && position && (
                  <Text size="xs" ta="center" mt="xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Too far from office — move closer to check in
                  </Text>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        {/* ── Right: Location ── */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md" h="100%">
            <Card withBorder radius="xl" p="lg">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <ThemeIcon
                    variant="light"
                    color={position ? 'teal' : 'gray'}
                    size="md"
                    radius="md"
                  >
                    {position ? <IconWifi size={18} /> : <IconWifiOff size={18} />}
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>
                      GPS Signal
                    </Text>
                    <Text size="xs" c="dimmed">
                      {position
                        ? `±${Math.round(position.accuracy)}m accuracy`
                        : 'Waiting for signal...'}
                    </Text>
                  </div>
                </Group>
                {gpsLoading ? (
                  <Loader size="sm" />
                ) : (
                  <Badge variant="light" color={position ? 'teal' : 'gray'} radius="sm">
                    {position ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </Group>

              <Box
                p="sm"
                style={{
                  background:
                    'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                  borderRadius: 12,
                }}
              >
                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <IconMapPin
                    size={16}
                    color="var(--mantine-color-blue-5)"
                    style={{ marginTop: 1, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" c="dimmed" mb={2}>
                      Current address
                    </Text>
                    {addressLoading ? (
                      <Stack gap={4}>
                        <Skeleton h={10} radius="sm" />
                        <Skeleton h={10} w="70%" radius="sm" />
                      </Stack>
                    ) : address ? (
                      <Text size="sm" fw={500} lh={1.4}>
                        {address}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </div>
                </Group>
              </Box>

              {position && (
                <Text size="xs" c="dimmed" mt="xs">
                  {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                </Text>
              )}

              {gpsError && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" mt="sm" p="sm" radius="md">
                  <Text size="xs">{gpsError}</Text>
                </Alert>
              )}
            </Card>

            {hasOfficeLocation && (
              <Card withBorder radius="xl" p="lg">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={600} mb={2}>
                      Distance to Office
                    </Text>
                    <Text size="xs" c="dimmed">
                      Max allowed: {maxDist}m
                    </Text>
                  </div>
                  {distanceToOffice != null ? (
                    <RingProgress
                      size={80}
                      thickness={6}
                      sections={[
                        {
                          value: Math.min(100, (distanceToOffice / maxDist) * 100),
                          color: withinRange ? 'teal' : 'red',
                        },
                      ]}
                      label={
                        <Text ta="center" size="xs" fw={700} c={withinRange ? 'teal' : 'red'}>
                          {Math.round(distanceToOffice)}m
                        </Text>
                      }
                    />
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Group>
                {distanceToOffice != null && (
                  <Badge
                    mt="sm"
                    fullWidth
                    variant="light"
                    color={withinRange ? 'teal' : 'red'}
                    radius="sm"
                    size="sm"
                  >
                    {withinRange
                      ? `✓ Within range (${Math.round(distanceToOffice)}m / ${maxDist}m)`
                      : `✗ Out of range — ${Math.round(distanceToOffice - maxDist)}m too far`}
                  </Badge>
                )}
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
