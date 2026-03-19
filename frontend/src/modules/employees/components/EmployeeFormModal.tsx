import {
  Modal,
  Button,
  Group,
  TextInput,
  Select,
  Grid,
  Text,
  Stack,
  Textarea,
  Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { IconCalendar, IconClockHour5, IconClockHour8, IconUser } from '@tabler/icons-react';
import { employeeValidationRules, EXISTS_MSG } from '../rule-form/employee-validation';
import type { EmployeeFormValues, IWorkSchedule } from '../types';
import { useGetAllPositions } from '../../positions/api/get-positions';
import { checkEmployeeExists, type CheckExistsField } from '../api/check-employee-exists';
import { PRIMARY_COLOR } from '../../../theme';

interface EmployeeFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: Partial<EmployeeFormValues>;
  employeeId?: string;
  onSubmit: (values: EmployeeFormValues, id?: string) => void | Promise<void>;
  loading?: boolean;
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return { value: `${h}:${m}`, label: `${h}:${m}` };
});
const UNIQUE_FIELDS: CheckExistsField[] = ['employee_code', 'email', 'identify_card'];

const DEFAULT_SCHEDULE: IWorkSchedule = {
  working_days: 5,
  start_time: '08:00',
  end_time: '17:00',
};

const DEFAULT_SELECTED_DAYS = [1, 2, 3, 4, 5];

const EMPTY_VALUES: EmployeeFormValues = {
  employee_code: '',
  full_name: '',
  display_name: '',
  email: '',
  phone: '',
  identify_card: '',
  gender: '',
  date_of_birth: null,
  address: '',
  hire_date: new Date(),
  position_id: '',
  status: 'active',
  avatar: null,
  work_schedules: DEFAULT_SCHEDULE,
};

export function EmployeeFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  employeeId,
  onSubmit,
  loading = false,
}: EmployeeFormModalProps) {
  const { data: positionsData, isLoading: isPositionsLoading } = useGetAllPositions();

  const [existsErrors, setExistsErrors] = useState<Partial<Record<CheckExistsField, string>>>({});
  const [checkingFields, setCheckingFields] = useState<Partial<Record<CheckExistsField, boolean>>>(
    {},
  );
  const debounceTimers = useRef<Partial<Record<CheckExistsField, ReturnType<typeof setTimeout>>>>(
    {},
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(DEFAULT_SELECTED_DAYS);

  const form = useForm<EmployeeFormValues>({
    initialValues: EMPTY_VALUES,
    validate: {
      employee_code: employeeValidationRules.employee_code,
      full_name: employeeValidationRules.full_name,
      display_name: employeeValidationRules.display_name,
      email: employeeValidationRules.email,
      phone: employeeValidationRules.phone,
      identify_card: employeeValidationRules.identify_card,
      gender: employeeValidationRules.gender,
      date_of_birth: employeeValidationRules.date_of_birth,
      hire_date: employeeValidationRules.hire_date,
      address: employeeValidationRules.address,
      position_id: employeeValidationRules.position_id,
      status: employeeValidationRules.status,
    },
  });

  useEffect(() => {
    if (opened) {
      setExistsErrors({});
      setCheckingFields({});
      const initSchedule = initialValues?.work_schedules ?? DEFAULT_SCHEDULE;
      // Restore selectedDays from working_days count (default to first N weekdays)
      const count = typeof initSchedule.working_days === 'number' ? initSchedule.working_days : 5;
      setSelectedDays(DAYS.slice(0, count).map((d) => d.value));
      form.setValues(
        initialValues
          ? { ...EMPTY_VALUES, ...initialValues, work_schedules: initSchedule }
          : EMPTY_VALUES,
      );
    }
  }, [opened]);

  const scheduleCheck = useCallback(
    (field: CheckExistsField, value: string) => {
      clearTimeout(debounceTimers.current[field]);
      setExistsErrors((prev) => ({ ...prev, [field]: undefined }));
      if (!value?.trim()) return;
      debounceTimers.current[field] = setTimeout(async () => {
        setCheckingFields((prev) => ({ ...prev, [field]: true }));
        try {
          const exists = await checkEmployeeExists(field, value, employeeId);
          setExistsErrors((prev) => ({
            ...prev,
            [field]: exists ? EXISTS_MSG[field] : undefined,
          }));
        } finally {
          setCheckingFields((prev) => ({ ...prev, [field]: false }));
        }
      }, 600);
    },
    [employeeId],
  );

  const hasExistsError = UNIQUE_FIELDS.some((f) => !!existsErrors[f]);
  const isChecking = Object.values(checkingFields).some(Boolean);

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (hasExistsError) return;
    await onSubmit(values, employeeId);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    setExistsErrors({});
    setSelectedDays(DEFAULT_SELECTED_DAYS);
    onClose();
  };

  const positionOptions = useMemo(
    () =>
      positionsData?.data?.map((pos) => ({
        value: pos.id,
        label: `${pos.position_name}${pos.level ? ` (${pos.level})` : ''}`,
      })) ?? [],
    [positionsData],
  );

  const uniqueFieldProps = (field: CheckExistsField) => {
    const base = form.getInputProps(field);
    return {
      ...base,
      error: base.error || existsErrors[field],
      rightSection: checkingFields[field] ? (
        <Text size="xs" c="dimmed">
          checking…
        </Text>
      ) : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        base.onChange(e);
        scheduleCheck(field, e.currentTarget.value);
      },
    };
  };

  // Work schedule helpers
  const schedule: IWorkSchedule = form.values.work_schedules ?? DEFAULT_SCHEDULE;
  const sharedStartTime = schedule.start_time;
  const sharedEndTime = schedule.end_time;

  const updateSchedule = (key: keyof IWorkSchedule, value: string | number) => {
    form.setFieldValue('work_schedules', { ...schedule, [key]: value });
  };

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(next);
    form.setFieldValue('work_schedules', { ...schedule, working_days: next.length });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT EMPLOYEE' : 'ADD EMPLOYEE'}
        </Text>
      }
      size="xl"
      centered
      styles={{
        header: { padding: '5px 15px' },
        body: { paddingTop: '10px' },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Divider
            label={
              <Group gap={6} align="center">
                <IconUser size={14} />
                <Text size="sm" fw={700}>
                  General Information
                </Text>
              </Group>
            }
            labelPosition="left"
          />
          {/* Basic Info */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <TextInput
                label="Employee Code"
                placeholder="e.g., EMP-001"
                required
                disabled={mode === 'edit'}
                {...(mode === 'add'
                  ? uniqueFieldProps('employee_code')
                  : form.getInputProps('employee_code'))}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                required
                {...form.getInputProps('full_name')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Display Name"
                placeholder="Optional"
                {...form.getInputProps('display_name')}
              />
            </Grid.Col>
          </Grid>

          {/* Contact */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <TextInput
                label="Email"
                placeholder="example@company.com"
                type="email"
                required
                {...uniqueFieldProps('email')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Phone"
                placeholder="+84 123 456 789"
                required
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Identity Card"
                placeholder="ID card number"
                required
                {...uniqueFieldProps('identify_card')}
              />
            </Grid.Col>
          </Grid>

          {/* Personal */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Select
                label="Gender"
                placeholder="Select gender"
                required
                data={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                {...form.getInputProps('gender')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <DateInput
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                valueFormat="DD/MM/YYYY"
                clearable
                required
                maxDate={new Date()}
                {...form.getInputProps('date_of_birth')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Position"
                placeholder="Select position"
                required
                data={positionOptions}
                searchable
                disabled={isPositionsLoading}
                {...form.getInputProps('position_id')}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Address"
            placeholder="Enter full address"
            required
            autosize
            minRows={2}
            {...form.getInputProps('address')}
          />

          {/* Employment */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <DateInput
                label="Hire Date"
                placeholder="DD/MM/YYYY"
                valueFormat="DD/MM/YYYY"
                required
                maxDate={new Date()}
                {...form.getInputProps('hire_date')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Status"
                placeholder="Select status"
                required
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
          </Grid>

          {/* Work Schedule */}
          <Divider
            mt="xs"
            label={
              <Group gap={6} align="center">
                <IconCalendar size={14} />
                <Text size="sm" fw={700}>
                  Work Schedule
                </Text>
              </Group>
            }
            labelPosition="left"
          />
          <Text size="xs" c="dimmed">
            Set the number of working days per week and shift hours. This will be used to track
            attendance automatically.
          </Text>
          <Stack gap="sm">
            <Stack gap={4}>
              <Group gap={6}>
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      size="xs"
                      variant={active ? PRIMARY_COLOR : 'outline'}
                      color={active ? 'violet' : 'gray'}
                      onClick={() => toggleDay(day.value)}
                      styles={{
                        root: { minWidth: 44, fontWeight: active ? 700 : 400, borderRadius: 16 },
                      }}
                    >
                      {day.label}
                    </Button>
                  );
                })}
                <Text size="xs" c="dimmed" ml={4}>
                  {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} / week
                </Text>
              </Group>
            </Stack>

            <Group gap={10} align="center" style={{ width: '100%' }}>
              <Group
                align="center"
                style={{
                  flex: 1,
                  justifyContent: 'space-between',
                  padding: '0px 4px',
                  border: '1.5px solid #dee2e6',
                  borderRadius: 8,
                }}
              >
                <Group gap={6} align="center">
                  <IconClockHour8 size={14} color="#868e96" />
                  <Text size="xs" c="dimmed" fw={500}>
                    From
                  </Text>
                </Group>
                <Select
                  data={TIME_OPTIONS}
                  value={sharedStartTime}
                  searchable
                  variant="unstyled"
                  w={80}
                  styles={{ input: { fontWeight: 600, padding: 0 } }}
                  onChange={(v) => v && updateSchedule('start_time', v)}
                />
              </Group>
              <Group
                align="center"
                style={{
                  flex: 1,
                  justifyContent: 'space-between',
                  padding: '0px 4px',
                  border: '1.5px solid #dee2e6',
                  borderRadius: 8,
                }}
              >
                <Group gap={6} align="center">
                  <IconClockHour5 size={14} color="#868e96" />
                  <Text size="xs" c="dimmed" fw={500}>
                    To
                  </Text>
                </Group>
                <Select
                  data={TIME_OPTIONS}
                  value={sharedEndTime}
                  searchable
                  variant="unstyled"
                  w={80}
                  styles={{ input: { fontWeight: 600, padding: 0 } }}
                  onChange={(v) => v && updateSchedule('end_time', v)}
                />
              </Group>
            </Group>
          </Stack>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={hasExistsError || isChecking}>
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
