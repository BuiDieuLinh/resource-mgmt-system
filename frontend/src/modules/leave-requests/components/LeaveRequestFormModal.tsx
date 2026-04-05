import { Modal, Stack, Select, Group, Button, Textarea, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useMemo } from 'react';
import { PRIMARY_COLOR } from '@/theme';
import { DATE_FORMAT, LEAVE_TYPE_OPTIONS } from '@/constant';
import { useGetEmployee } from '@/modules/employees/api/get-employee';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ILeaveRequest, ILeaveRequestPayload } from '../types';
import { toDateOnly } from '@/utils/date';
import { TIME_OPTIONS } from '@/modules/employees/utils/time-option';

interface LeaveRequestFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: ILeaveRequest | null;
  onSubmit: (payload: ILeaveRequestPayload, id?: string) => void | Promise<void>;
  loading?: boolean;
}

interface FormValues {
  employee_id: string;
  leave_type: string;
  start_date: Date | null;
  end_date: Date | null;
  leave_start_minutes: string | null;
  leave_end_minutes: string | null;
  reason: string;
}

const EMPTY: FormValues = {
  employee_id: '',
  leave_type: 'annual',
  start_date: null,
  end_date: null,
  leave_start_minutes: null,
  leave_end_minutes: null,
  reason: '',
};

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MIN_DATE = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

export function LeaveRequestFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  onSubmit,
  loading = false,
}: LeaveRequestFormModalProps) {
  const { user } = useAuthStore();
  const { data: currentEmployeeData } = useGetEmployeeByUserId(user?.id);
  const currentEmployee = currentEmployeeData?.data;

  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      employee_id: (v) => (!v ? 'Employee is required' : null),
      leave_type: (v) => (!v ? 'Leave type is required' : null),
      start_date: (v) => (!v ? 'Start date is required' : null),
      end_date: (v) => (!v ? 'End date is required' : null),
    },
  });

  const { data: employeeData } = useGetEmployee(form.values.employee_id);

  const defaultSchedule = useMemo(() => {
    const schedules = (currentEmployee ?? employeeData?.data)?.work_schedules;
    if (!schedules?.length) return { start: null, end: null };
    return {
      start: String(schedules[0].start_time),
      end: String(schedules[0].end_time),
    };
  }, [currentEmployee, employeeData]);

  useEffect(() => {
    if (currentEmployee && !form.values.employee_id) {
      form.setFieldValue('employee_id', currentEmployee.id);
    }
  }, [currentEmployee]);

  useEffect(() => {
    if (form.values.employee_id && defaultSchedule.start) {
      form.setFieldValue('leave_start_minutes', defaultSchedule.start);
      form.setFieldValue('leave_end_minutes', defaultSchedule.end);
    }
  }, [form.values.employee_id, defaultSchedule.start]);

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        form.setValues({
          employee_id: initialValues.employee_id,
          leave_type: initialValues.leave_type,
          start_date: parseLocalDate(initialValues.start_date),
          end_date: parseLocalDate(initialValues.end_date),
          leave_start_minutes:
            initialValues.leave_start_minutes != null
              ? String(initialValues.leave_start_minutes)
              : null,
          leave_end_minutes:
            initialValues.leave_end_minutes != null
              ? String(initialValues.leave_end_minutes)
              : null,
          reason: initialValues.reason ?? '',
        });
      } else {
        form.reset();
        if (currentEmployee) {
          form.setFieldValue('employee_id', currentEmployee.id);
        }
      }
    }
  }, [opened]);

  const handleSubmit = async (values: FormValues) => {
    const payload: ILeaveRequestPayload = {
      employee_id: values.employee_id,
      leave_type: values.leave_type as ILeaveRequestPayload['leave_type'],
      start_date: toDateOnly(values.start_date!)!,
      end_date: toDateOnly(values.end_date!)!,
      leave_start_minutes:
        values.leave_start_minutes != null ? Number(values.leave_start_minutes) : undefined,
      leave_end_minutes:
        values.leave_end_minutes != null ? Number(values.leave_end_minutes) : undefined,
      reason: values.reason?.trim() || undefined,
    };
    await onSubmit(payload, initialValues?.id);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT LEAVE REQUEST' : 'NEW LEAVE REQUEST'}
        </Text>
      }
      centered
      size="md"
      styles={{ header: { padding: '5px 15px' }, body: { paddingTop: 10 } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            checkIconPosition="right"
            label="Leave Type"
            placeholder="Select type"
            required
            data={LEAVE_TYPE_OPTIONS}
            {...form.getInputProps('leave_type')}
          />
          <Group grow>
            <DateInput
              label="Start Date"
              placeholder={DATE_FORMAT}
              valueFormat={DATE_FORMAT}
              required
              minDate={MIN_DATE}
              {...form.getInputProps('start_date')}
            />
            <DateInput
              label="End Date"
              placeholder={DATE_FORMAT}
              valueFormat={DATE_FORMAT}
              required
              minDate={form.values.start_date ?? MIN_DATE}
              {...form.getInputProps('end_date')}
            />
          </Group>

          <Group grow>
            <Select
              checkIconPosition="right"
              label="Leave from"
              placeholder="Start time"
              data={TIME_OPTIONS}
              searchable
              clearable
              {...form.getInputProps('leave_start_minutes')}
            />
            <Select
              checkIconPosition="right"
              label="Leave until"
              placeholder="End time"
              data={TIME_OPTIONS}
              searchable
              clearable
              {...form.getInputProps('leave_end_minutes')}
            />
          </Group>

          <Textarea
            label="Reason"
            placeholder="Optional reason"
            autosize
            minRows={2}
            {...form.getInputProps('reason')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'edit' ? 'Update' : 'Submit'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
