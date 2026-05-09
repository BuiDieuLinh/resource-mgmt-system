import {
  Modal,
  Button,
  Group,
  Stack,
  Switch,
  Select,
  Text,
  Grid,
  NumberInput,
  TextInput,
  Anchor,
  Loader,
  Box,
  Badge,
  Paper,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useState, useRef } from 'react';
import { IconClock, IconCalendar, IconCoffee, IconMapPin, IconX } from '@tabler/icons-react';
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
  office_latitude: number | null;
  office_longitude: number | null;
  max_distance_meters: number;
  effective_from: Date | null;
  effective_to: Date | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const EMPTY: FormValues = {
  is_flexible_enabled: false,
  flexible_start: 10,
  flexible_end: 10,
  break_start: '12:00',
  break_end: '13:00',
  office_latitude: null,
  office_longitude: null,
  max_distance_meters: 100,
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
  const [addressValue, setAddressValue] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!opened) return;
    if (initialValues) {
      const lat =
        initialValues.office_latitude != null ? Number(initialValues.office_latitude) : null;
      const lng =
        initialValues.office_longitude != null ? Number(initialValues.office_longitude) : null;
      form.setValues({
        is_flexible_enabled: initialValues.is_flexible_enabled,
        flexible_start: initialValues.flexible_start ?? 10,
        flexible_end: initialValues.flexible_end ?? 10,
        break_start:
          initialValues.break_start != null ? minutesToTime(initialValues.break_start) : '12:00',
        break_end:
          initialValues.break_end != null ? minutesToTime(initialValues.break_end) : '13:00',
        office_latitude: lat,
        office_longitude: lng,
        max_distance_meters: initialValues.max_distance_meters ?? 100,
        effective_from: new Date(initialValues.effective_from),
        effective_to: initialValues.effective_to ? new Date(initialValues.effective_to) : null,
      });

      if (lat != null && lng != null) {
        setAddressValue(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'Accept-Language': 'vi' },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.display_name) setAddressValue(d.display_name);
          })
          .catch(() => {});
      } else {
        setAddressValue('');
      }
    } else {
      form.setValues(EMPTY);
      setAddressValue('');
    }
    setSuggestions([]);
  }, [opened]);

  const hasLocation = form.values.office_latitude != null && form.values.office_longitude != null;

  const handleAddressChange = (value: string) => {
    setAddressValue(value);
    form.setFieldValue('office_latitude', null);
    form.setFieldValue('office_longitude', null);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'vi' } },
        );
        setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = (r: NominatimResult) => {
    form.setFieldValue('office_latitude', parseFloat(r.lat));
    form.setFieldValue('office_longitude', parseFloat(r.lon));
    setAddressValue(r.display_name);
    setSuggestions([]);
  };

  const handleClearLocation = () => {
    form.setFieldValue('office_latitude', null);
    form.setFieldValue('office_longitude', null);
    setAddressValue('');
    setSuggestions([]);
  };

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(
      {
        is_flexible_enabled: values.is_flexible_enabled,
        break_start: timeToMinutes(values.break_start),
        break_end: timeToMinutes(values.break_end),
        flexible_start: values.is_flexible_enabled ? values.flexible_start : null,
        flexible_end: values.is_flexible_enabled ? values.flexible_end : null,
        office_latitude: values.office_latitude,
        office_longitude: values.office_longitude,
        max_distance_meters: values.office_latitude != null ? values.max_distance_meters : null,
        effective_from: toISO(values.effective_from)!,
        effective_to: toISO(values.effective_to),
      },
      initialValues?.id,
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT WORK POLICY' : 'ADD WORK POLICY'}
        </Text>
      }
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Break + Flexible — same row, equal height via align="stretch" */}
          <Grid gutter="md" align="stretch">
            <Grid.Col span={6}>
              <Paper withBorder p="sm" radius="md" h="100%">
                <Group gap={6} mb="xs">
                  <IconCoffee size={14} />
                  <Text size="sm" fw={600}>
                    Break Time
                  </Text>
                </Group>
                <Grid gutter="sm">
                  <Grid.Col span={6}>
                    <Select
                      size="xs"
                      checkIconPosition="right"
                      label="Start"
                      data={TIME_OPTIONS}
                      searchable
                      leftSection={<IconClock size={13} />}
                      {...form.getInputProps('break_start')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      size="xs"
                      checkIconPosition="right"
                      label="End"
                      data={TIME_OPTIONS}
                      searchable
                      leftSection={<IconClock size={13} />}
                      {...form.getInputProps('break_end')}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper withBorder p="sm" radius="md" h="100%">
                <Group gap={6} mb="xs">
                  <IconClock size={14} />
                  <Text size="sm" fw={600}>
                    Flexible Window
                  </Text>
                </Group>
                <Switch
                  size="sm"
                  label="Enable grace window"
                  mb={form.values.is_flexible_enabled ? 'xs' : 0}
                  {...form.getInputProps('is_flexible_enabled', { type: 'checkbox' })}
                />
                {form.values.is_flexible_enabled && (
                  <Grid gutter="sm">
                    <Grid.Col span={6}>
                      <NumberInput
                        size="xs"
                        label="Check-in grace"
                        min={0}
                        max={120}
                        suffix=" min"
                        {...form.getInputProps('flexible_start')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        size="xs"
                        label="Check-out grace"
                        min={0}
                        max={120}
                        suffix=" min"
                        {...form.getInputProps('flexible_end')}
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          <Paper withBorder p="sm" radius="md">
            <Group gap={6} mb="xs">
              <IconMapPin size={14} />
              <Text size="sm" fw={600}>
                Office Location
              </Text>
              <Text size="xs" c="dimmed">
                (optional)
              </Text>
            </Group>

            <Group gap="sm" align="flex-end" wrap="nowrap">
              <Box style={{ flex: 1, position: 'relative' }}>
                <TextInput
                  size="xs"
                  label="Address"
                  placeholder="Search office address..."
                  leftSection={
                    searching ? (
                      <Loader size={12} />
                    ) : (
                      <IconMapPin
                        size={13}
                        color={hasLocation ? 'var(--mantine-color-teal-6)' : undefined}
                      />
                    )
                  }
                  rightSection={
                    addressValue ? (
                      <IconX
                        size={13}
                        style={{ cursor: 'pointer', opacity: 0.5 }}
                        onClick={handleClearLocation}
                      />
                    ) : null
                  }
                  value={addressValue}
                  onChange={(e) => handleAddressChange(e.currentTarget.value)}
                  readOnly={hasLocation}
                  styles={
                    hasLocation
                      ? { input: { color: 'var(--mantine-color-teal-7)', fontWeight: 500 } }
                      : undefined
                  }
                />
                {suggestions.length > 0 && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 300,
                      background: 'var(--mantine-color-body)',
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 8,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    {suggestions.map((s) => (
                      <Box
                        key={s.place_id}
                        px="sm"
                        py={6}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--mantine-color-default-border)',
                        }}
                        onMouseDown={() => handleSelectSuggestion(s)}
                      >
                        <Text size="xs" lineClamp={1}>
                          {s.display_name}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <NumberInput
                size="xs"
                label="Radius"
                min={10}
                max={5000}
                suffix=" m"
                disabled={!hasLocation}
                style={{ width: 110 }}
                {...form.getInputProps('max_distance_meters')}
              />
            </Group>

            {hasLocation && (
              <Group mt={6} gap={6}>
                <Badge size="xs" variant="light" color="teal">
                  {Number(form.values.office_latitude).toFixed(5)},{' '}
                  {Number(form.values.office_longitude).toFixed(5)}
                </Badge>
                <Anchor
                  size="xs"
                  href={`https://www.google.com/maps?q=${form.values.office_latitude},${form.values.office_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on map ↗
                </Anchor>
              </Group>
            )}
          </Paper>

          {/* Effective Period */}
          <Paper withBorder p="sm" radius="md">
            <Group gap={6} mb="xs">
              <IconCalendar size={14} />
              <Text size="sm" fw={600}>
                Effective Period
              </Text>
            </Group>
            <Grid gutter="sm">
              <Grid.Col span={6}>
                <DateInput
                  size="xs"
                  label="From"
                  placeholder={DATE_FORMAT}
                  valueFormat={DATE_FORMAT}
                  required
                  {...form.getInputProps('effective_from')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  size="xs"
                  label="To"
                  placeholder="No end date"
                  valueFormat={DATE_FORMAT}
                  clearable
                  minDate={form.values.effective_from ?? undefined}
                  {...form.getInputProps('effective_to')}
                />
              </Grid.Col>
            </Grid>
          </Paper>
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
