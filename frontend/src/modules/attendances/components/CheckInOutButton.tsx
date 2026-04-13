import { Button, Group, Text, Badge } from '@mantine/core';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { notify } from '@/components/Notification';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useCheckIn, useCheckOut } from '../api/check-in-out';
import { useGetTodayAttendance } from '../api/get-today-attendance';
import { useGPS } from '@/hooks/useGPS';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/constant/index';

export function CheckInOutButton() {
  const { user } = useAuthStore();
  const { data: empData } = useGetEmployeeByUserId(user?.id);
  const employee = empData?.data;

  const { data: todayData, refetch: refetchToday } = useGetTodayAttendance(employee?.id);
  const todayRecord = todayData?.data;

  const hasCheckedIn = !!todayRecord?.check_in_time;
  const hasCheckedOut = !!todayRecord?.check_out_time;

  const { getPosition } = useGPS();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const handleCheckIn = async () => {
    if (!employee) return;
    const notiId = notify.loading('Checking in...');
    try {
      const gps = await getPosition().catch(() => ({ latitude: 0, longitude: 0 }));
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
      const gps = await getPosition().catch(() => ({ latitude: 0, longitude: 0 }));
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(DEFAULT_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DEFAULT_TIMEZONE,
    });

  return (
    <Group gap="sm" align="center">
      {hasCheckedIn && todayRecord?.check_in_time && (
        <Badge variant="light" color={hasCheckedOut ? 'gray' : 'teal'} size="sm">
          In {formatTime(todayRecord.check_in_time)}
          {hasCheckedOut && todayRecord.check_out_time && (
            <Text span c="dimmed" mx={4}>
              ·
            </Text>
          )}
          {hasCheckedOut &&
            todayRecord.check_out_time &&
            `Out ${formatTime(todayRecord.check_out_time)}`}
        </Badge>
      )}

      <Button
        size="sm"
        variant="light"
        color="blue"
        leftSection={<IconLogin size={15} />}
        disabled={hasCheckedIn || checkInMutation.isPending}
        loading={checkInMutation.isPending}
        onClick={handleCheckIn}
      >
        Check In
      </Button>

      <Button
        size="sm"
        variant="light"
        color="red"
        leftSection={<IconLogout size={15} />}
        disabled={!hasCheckedIn || hasCheckedOut || checkOutMutation.isPending}
        loading={checkOutMutation.isPending}
        onClick={handleCheckOut}
      >
        Check Out
      </Button>
    </Group>
  );
}
