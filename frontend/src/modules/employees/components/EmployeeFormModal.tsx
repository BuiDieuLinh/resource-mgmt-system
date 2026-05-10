import {
  Modal,
  Group,
  TextInput,
  Select,
  Grid,
  Text,
  Stack,
  Textarea,
  Divider,
  Button,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { IconCalendar, IconClockHour5, IconClockHour8, IconUser } from '@tabler/icons-react';
import {
  employeeValidationRules,
  hireDateRule,
  EXISTS_MSG,
} from '../rule-form/employee-validation';
import type { EmployeeFormValues } from '../types';
import { useGetAllPositions } from '../../positions/api/get-positions';
import { useGetEmployees } from '../api/get-employees';
import { checkEmployeeExists, type CheckExistsField } from '../api/check-employee-exists';
import { PRIMARY_COLOR } from '../../../theme';
import {
  DEFAULT_WORK_DAYS,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  DATE_FORMAT,
  LEVEL_LABEL,
  CONTRACT_TYPE_OPTIONS,
  type LevelPosition,
} from '../../../constant';
import { WorkDayBadges } from './WorkDayBadges';
import { buildSchedules } from '../utils/time-option';
import { TIME_OPTIONS } from '../utils/time-option';

interface EmployeeFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: Partial<EmployeeFormValues>;
  employeeId?: string;
  onSubmit: (values: EmployeeFormValues, id?: string) => void | Promise<void>;
  loading?: boolean;
}

const UNIQUE_FIELDS: CheckExistsField[] = ['employee_code', 'email', 'identify_card'];

const EMPTY_VALUES: EmployeeFormValues = {
  employee_code: '',
  full_name: '',
  display_name: '',
  email: '',
  phone: '',
  identify_card: '',
  gender: 'Male',
  date_of_birth: '2000-01-01',
  address: '',
  hire_date: new Date(),
  position_id: '',
  status: 'active',
  contract_type: 'probation',
  manager_id: '',
  terminated_at: null,
  avatar: null,
  work_schedules: buildSchedules(DEFAULT_WORK_DAYS, DEFAULT_START_TIME, DEFAULT_END_TIME),
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
  const { data: employeesData, isLoading: isEmployeesLoading } = useGetEmployees({
    pageIndex: 1,
  });

  const [existsErrors, setExistsErrors] = useState<Partial<Record<CheckExistsField, string>>>({});
  const [checkingFields, setCheckingFields] = useState<Partial<Record<CheckExistsField, boolean>>>(
    {},
  );
  const debounceTimers = useRef<Partial<Record<CheckExistsField, ReturnType<typeof setTimeout>>>>(
    {},
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(DEFAULT_WORK_DAYS);
  const [startTime, setStartTime] = useState<number>(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState<number>(DEFAULT_END_TIME);

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
      hire_date: hireDateRule(mode),
      address: employeeValidationRules.address,
      position_id: employeeValidationRules.position_id,
      status: employeeValidationRules.status,
      contract_type: employeeValidationRules.contract_type,
    },
  });

  useEffect(() => {
    if (opened) {
      setExistsErrors({});
      setCheckingFields({});
      const schedules = initialValues?.work_schedules ?? [];
      const days = schedules.length > 0 ? schedules.map((s) => s.day_of_week) : DEFAULT_WORK_DAYS;
      const start = schedules[0]?.start_time ?? DEFAULT_START_TIME;
      const end = schedules[0]?.end_time ?? DEFAULT_END_TIME;
      setSelectedDays(days);
      setStartTime(start);
      setEndTime(end);
      form.setValues(
        initialValues
          ? { ...EMPTY_VALUES, ...initialValues, work_schedules: buildSchedules(days, start, end) }
          : EMPTY_VALUES,
      );
    }
  }, [opened]);

  // Re-sync position_id after positions finish loading (Select clears value if options not ready)
  useEffect(() => {
    if (opened && !isPositionsLoading && initialValues?.position_id) {
      form.setFieldValue('position_id', initialValues.position_id);
    }
  }, [isPositionsLoading]);

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
  };

  const handleClose = () => {
    form.reset();
    setExistsErrors({});
    setSelectedDays(DEFAULT_WORK_DAYS);
    setStartTime(DEFAULT_START_TIME);
    setEndTime(DEFAULT_END_TIME);
    onClose();
  };

  const positionOptions = useMemo(
    () =>
      positionsData?.data?.map((pos) => ({
        value: pos.id,
        label: `${pos.position_name}${LEVEL_LABEL[pos.level as LevelPosition] ? ` (${LEVEL_LABEL[pos.level as LevelPosition]})` : ''}`,
      })) ?? [],
    [positionsData],
  );

  const managerOptions = useMemo(
    () =>
      employeesData?.data
        ?.filter((emp) => emp.id !== employeeId && emp.status === 'active')
        ?.map((emp) => ({
          value: emp.id,
          label: `${emp.full_name} (${emp.employee_code}) - ${emp.position.position_name}`,
        })) ?? [],
    [employeesData, employeeId],
  );

  const uniqueFieldProps = (field: CheckExistsField) => {
    const base = form.getInputProps(field);
    return {
      ...base,
      error: base.error || existsErrors[field],
      rightSection: checkingFields[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        base.onChange(e);
        scheduleCheck(field, e.currentTarget.value);
      },
    };
  };

  const syncSchedule = (days: number[], start: number, end: number) => {
    form.setFieldValue('work_schedules', buildSchedules(days, start, end));
  };

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(next);
    syncSchedule(next, startTime, endTime);
  };

  const handleStartChange = (v: string | null) => {
    const val = Number(v);
    setStartTime(val);
    syncSchedule(selectedDays, val, endTime);
  };

  const handleEndChange = (v: string | null) => {
    const val = Number(v);
    setEndTime(val);
    syncSchedule(selectedDays, startTime, val);
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
                <IconUser size={16} />
                <Text size="sm" fw={700}>
                  General Information
                </Text>
              </Group>
            }
            labelPosition="left"
          />
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

          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Select
                checkIconPosition="right"
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
                placeholder={DATE_FORMAT}
                valueFormat={DATE_FORMAT}
                clearable
                required
                maxDate={new Date()}
                {...form.getInputProps('date_of_birth')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                checkIconPosition="right"
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

          <Grid gutter="sm">
            <Grid.Col span={4}>
              <DateInput
                label="Hire Date"
                placeholder={DATE_FORMAT}
                valueFormat={DATE_FORMAT}
                required
                excludeDate={(date) =>
                  new Date(date).getDay() === 0 || new Date(date).getDay() === 6
                }
                {...(mode === 'edit' ? { maxDate: new Date() } : {})}
                {...form.getInputProps('hire_date')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                checkIconPosition="right"
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
            <Grid.Col span={4}>
              <Select
                checkIconPosition="right"
                label="Contract Type"
                placeholder="Select contract type"
                required
                data={CONTRACT_TYPE_OPTIONS}
                {...form.getInputProps('contract_type')}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Select
                checkIconPosition="right"
                label="Manager"
                placeholder="Select manager (optional)"
                clearable
                searchable
                data={managerOptions}
                disabled={isEmployeesLoading}
                {...form.getInputProps('manager_id')}
              />
            </Grid.Col>
            {form.values.status === 'inactive' && (
              <Grid.Col span={6}>
                <DateInput
                  label="Terminated Date"
                  placeholder={DATE_FORMAT}
                  valueFormat={DATE_FORMAT}
                  clearable
                  maxDate={new Date()}
                  {...form.getInputProps('terminated_at')}
                />
              </Grid.Col>
            )}
          </Grid>

          <Divider
            mt="xs"
            label={
              <Group gap={6} align="center">
                <IconCalendar size={16} />
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
                <WorkDayBadges days={selectedDays} onToggle={toggleDay} />
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
                  <IconClockHour8 size={16} color="#868e96" />
                  <Text size="xs" c="dimmed" fw={500}>
                    From
                  </Text>
                </Group>
                <Select
                  data={TIME_OPTIONS}
                  value={String(startTime)}
                  searchable
                  checkIconPosition="right"
                  variant="unstyled"
                  w={120}
                  styles={{ input: { fontWeight: 600, padding: 0 } }}
                  onChange={handleStartChange}
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
                  <IconClockHour5 size={16} color="#868e96" />
                  <Text size="xs" c="dimmed" fw={500}>
                    To
                  </Text>
                </Group>
                <Select
                  checkIconPosition="right"
                  data={TIME_OPTIONS}
                  value={String(endTime)}
                  searchable
                  variant="unstyled"
                  w={120}
                  styles={{ input: { fontWeight: 600, padding: 0 } }}
                  onChange={handleEndChange}
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
