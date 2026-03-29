import {
  Modal,
  Button,
  Group,
  Stack,
  Switch,
  Select,
  Text,
  Divider,
  Grid,
  NumberInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconClock, IconCalendar, IconCoffee } from '@tabler/icons-react';
import { PRIMARY_COLOR } from '@/theme';
import { TIME_OPTIONS, minutesToTime, timeToMinutes } from '../utils/time';
import type { IWorkPolicy, IWorkPolicyPayload } from '../types';
import { DATE_FORMAT } from '@/constant';
import { toISO } from '@/utils/date';

interface Props {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: IWorkPolicy | null;
  onSubmit: (payload: IWorkPolicyPayload, id?: string) => Promise<void>;
  loading?: boolean;
}

interface FormValues {
  is_flexible_enabled: boolean;
  flexible_start: number;
  flexible_end: number;
  break_start: string;
  break_end: string;
  effective_from: Date | null;
  effective_to: Date | null;
}

const EMPTY: FormValues = {
  is_flexible_enabled: false,
  flexible_start: 10,
  flexible_end: 10,
  break_start: '12:00',
  break_end: '13:00',
  effective_from: new Date(),
  effective_to: null,
};

export function WorkPolicyFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  onSubmit,
  loading,
}: Props) {
  const form = useForm<FormValues>({ initialValues: EMPTY });

  useEffect(() => {
    if (!opened) return;
    if (initialValues) {
      form.setValues({
        is_flexible_enabled: initialValues.is_flexible_enabled,
        flexible_start: initialValues.flexible_start ?? 10,
        flexible_end: initialValues.flexible_end ?? 10,
        break_start:
          initialValues.break_start != null ? minutesToTime(initialValues.break_start) : '12:00',
        break_end:
          initialValues.break_end != null ? minutesToTime(initialValues.break_end) : '13:00',
        effective_from: new Date(initialValues.effective_from),
        effective_to: initialValues.effective_to ? new Date(initialValues.effective_to) : null,
      });
    } else {
      form.setValues(EMPTY);
    }
  }, [opened]);

  const handleSubmit = async (values: FormValues) => {
    const payload: IWorkPolicyPayload = {
      is_flexible_enabled: values.is_flexible_enabled,
      break_start: timeToMinutes(values.break_start),
      break_end: timeToMinutes(values.break_end),
      flexible_start: values.is_flexible_enabled ? values.flexible_start : null,
      flexible_end: values.is_flexible_enabled ? values.flexible_end : null,
      effective_from: toISO(values.effective_from)!,
      effective_to: toISO(values.effective_to),
    };
    await onSubmit(payload, initialValues?.id);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="lg" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT WORK POLICY' : 'ADD WORK POLICY'}
        </Text>
      }
      size="md"
      centered
      styles={{ header: { padding: '5px 15px' }, body: { paddingTop: 10 } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {/* Break time */}
          <Divider
            label={
              <Group gap={6}>
                <IconCoffee size={14} />
                <Text size="sm" fw={700}>
                  Break Time
                </Text>
              </Group>
            }
            labelPosition="left"
          />
          <Text size="xs" c="dimmed">
            Time range when employees are on break (deducted from work hours).
          </Text>
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Select
                checkIconPosition="right"
                label="Break Start"
                data={TIME_OPTIONS}
                searchable
                leftSection={<IconClock size={14} />}
                {...form.getInputProps('break_start')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                checkIconPosition="right"
                label="Break End"
                data={TIME_OPTIONS}
                searchable
                leftSection={<IconClock size={14} />}
                {...form.getInputProps('break_end')}
              />
            </Grid.Col>
          </Grid>

          {/* Flexible */}
          <Divider
            label={
              <Group gap={6}>
                <IconClock size={14} />
                <Text size="sm" fw={700}>
                  Flexible Time
                </Text>
              </Group>
            }
            labelPosition="left"
            mt="xs"
          />
          <Switch
            label="Enable flexible grace window"
            description="Allow a tolerance window for check-in and check-out"
            {...form.getInputProps('is_flexible_enabled', { type: 'checkbox' })}
          />
          {form.values.is_flexible_enabled && (
            <Grid gutter="sm">
              <Grid.Col span={6}>
                <NumberInput
                  label="Check-in grace (minutes)"
                  description="e.g. 10 → check-in by 08:10 still counts as on time"
                  min={0}
                  max={120}
                  suffix=" min"
                  {...form.getInputProps('flexible_start')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Check-out grace (minutes)"
                  description="e.g. 10 → check-out after 16:50 still counts as full day"
                  min={0}
                  max={120}
                  suffix=" min"
                  {...form.getInputProps('flexible_end')}
                />
              </Grid.Col>
            </Grid>
          )}

          {/* Effective period */}
          <Divider
            label={
              <Group gap={6}>
                <IconCalendar size={14} />
                <Text size="sm" fw={700}>
                  Effective Period
                </Text>
              </Group>
            }
            labelPosition="left"
            mt="xs"
          />
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <DateInput
                label="Effective From"
                placeholder={DATE_FORMAT}
                valueFormat={DATE_FORMAT}
                required
                {...form.getInputProps('effective_from')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                label="Effective To"
                placeholder="Leave blank = no end"
                valueFormat={DATE_FORMAT}
                clearable
                minDate={form.values.effective_from ?? undefined}
                {...form.getInputProps('effective_to')}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
