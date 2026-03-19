import { Modal, Button, Group, Select, Stack, TextInput, Text } from '@mantine/core';

import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { IAttendance, IAttendancePayload } from '../types';
import { useGetAttendances } from '../api/get-attendances';

interface Props {
  opened: boolean;
  onClose: () => void;
  initial?: Partial<IAttendance>;
  onSave: (payload: IAttendancePayload) => void;
  loading?: boolean;
}

export function AttendanceFormModal({ opened, onClose, initial, onSave, loading = false }: Props) {
  useGetAttendances();

  const formatTime = (iso?: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    return d.toTimeString().split(' ')[0];
  };

  const form = useForm<IAttendancePayload>({
    initialValues: {
      employee_id: initial?.employee_id || '',
      date: initial?.date || new Date().toISOString(),
      check_in: formatTime(initial?.check_in),
      check_out: formatTime(initial?.check_out),
      status: initial?.status || 'approved',
    },
  });

  useEffect(() => {
    if (opened && initial) {
      form.setValues({
        employee_id: initial.employee_id,
        date: initial.date,
        check_in: formatTime(initial.check_in),
        check_out: formatTime(initial.check_out),
        status: initial.status || 'approved',
      });
    }
  }, [opened, initial]);

  const handleSubmit = (values: IAttendancePayload) => {
    const payload = { ...values };
    const baseDateStr = payload.date.split('T')[0];

    if (payload.check_in && payload.check_in.length <= 8) {
      payload.check_in = new Date(`${baseDateStr}T${payload.check_in}`).toISOString();
    }

    if (payload.check_out && payload.check_out.length <= 8) {
      payload.check_out = new Date(`${baseDateStr}T${payload.check_out}`).toISOString();
    }

    onSave(payload);
    form.reset();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Attendance record" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <input type="hidden" {...form.getInputProps('check_in_lat')} />
          <input type="hidden" {...form.getInputProps('check_in_lng')} />
          <input type="hidden" {...form.getInputProps('check_out_lat')} />
          <input type="hidden" {...form.getInputProps('check_out_lng')} />
          <TextInput label="Employee ID" {...form.getInputProps('employee_id')} required />
          <DateInput label="Date" {...form.getInputProps('date')} />
          <Group gap="xs">
            <TimeInput label="Check in" {...form.getInputProps('check_in')} />
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  console.log('check-in coords', latitude, longitude);
                  const now = new Date();
                  form.setFieldValue('check_in', now.toTimeString().split(' ')[0]);
                  form.setFieldValue('check_in_lat', latitude);
                  form.setFieldValue('check_in_lng', longitude);
                });
              }}
            >
              Capture GPS
            </Button>
          </Group>
          {form.values.check_in_lat && form.values.check_in_lng && (
            <Text size="xs" color="dimmed">
              Lat: {form.values.check_in_lat.toFixed(4)}, Lng: {form.values.check_in_lng.toFixed(4)}
            </Text>
          )}
          <Group gap="xs">
            <TimeInput label="Check out" {...form.getInputProps('check_out')} />
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  console.log('check-out coords', latitude, longitude);
                  const now = new Date();
                  form.setFieldValue('check_out', now.toTimeString().split(' ')[0]);
                  form.setFieldValue('check_out_lat', latitude);
                  form.setFieldValue('check_out_lng', longitude);
                });
              }}
            >
              Capture GPS
            </Button>
          </Group>
          {form.values.check_out_lat && form.values.check_out_lng && (
            <Text size="xs" color="dimmed">
              Lat: {form.values.check_out_lat.toFixed(4)}, Lng:{' '}
              {form.values.check_out_lng.toFixed(4)}
            </Text>
          )}{' '}
          <Select
            label="Status"
            data={[
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            {...form.getInputProps('status')}
          />
          <Group justify="right" mt="md">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
