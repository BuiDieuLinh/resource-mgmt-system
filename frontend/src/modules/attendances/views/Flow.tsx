import { useState, useEffect } from 'react';
import { Stack, Title, Button, Text, TextInput, Loader } from '@mantine/core';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { useGetAttendances } from '../api/get-attendances';
import { useCreateAttendance } from '../api/create-attendance';
import { useUpdateAttendance } from '../api/update-attendance';
import type { IAttendance } from '../types';

export default function AttendanceFlow() {
  const { data } = useGetAttendances();
  const { mutate: add } = useCreateAttendance();
  const { mutate: update } = useUpdateAttendance();

  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<IAttendance | null>(null);

  useEffect(() => {
    if (data) {
      const today = new Date().toDateString();
      const found = data.find(
        (r) =>
          new Date((r as any).work_date || r.date).toDateString() === today &&
          !((r as any).check_out_time || r.check_out),
      );
      setTodayRecord(found || null);
    }
  }, [data]);

  const [deviceId, setDeviceId] = useState('');

  const handleCheckIn = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const now = new Date();
      add({
        employee_id: 'd8392c79-d3ec-40d6-993a-f530b8d2e930', // hardcoded for demo
        date: now.toISOString(),
        check_in: now.toISOString(),
        check_in_lat: latitude,
        check_in_lng: longitude,
        status: 'approved',
      });
      setLoading(false);
    });
  };

  const handleCheckOut = () => {
    if (!todayRecord) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const now = new Date();
      update({
        id: todayRecord.id,
        payload: {
          check_out: now.toISOString(),
          check_out_lat: latitude,
          check_out_lng: longitude,
        },
      });
      setLoading(false);
    });
  };

  return (
    <Stack align="center" justify="center" p="md" gap="xl">
      <Title order={3}>Quick Attendance</Title>
      {loading && <Loader />}
      {!loading && (
        <>
          {!todayRecord && (
            <>
              <TextInput
                placeholder="Device ID (optional)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.currentTarget.value)}
                mb="md"
              />
              <Button size="xl" leftSection={<IconLogin size={24} />} onClick={handleCheckIn}>
                Check In
              </Button>
            </>
          )}
          {todayRecord && (
            <>
              {/* <Text>Checked in at {todayRecord.check_in_time || todayRecord.check_in}</Text>
              {todayRecord.device_id && (
                <Text size="sm" color="dimmed">
                  Device: {todayRecord.device_id}
                </Text>
              )} */}
              <Button
                size="xl"
                leftSection={<IconLogout size={24} />}
                color="red"
                onClick={handleCheckOut}
              >
                Check Out
              </Button>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
