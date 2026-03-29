import { Modal, Stack, TextInput, Textarea, Switch, Group, Button, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { PRIMARY_COLOR } from '@/theme';
import type { IHoliday, IHolidayPayload } from '../types';
import { DATE_FORMAT } from '@/constant';
import { toDateOnly } from '@/utils/date';

interface HolidayFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: IHoliday | null;
  onSubmit: (payload: IHolidayPayload, id?: string) => void | Promise<void>;
  loading?: boolean;
}

interface FormValues {
  name: string;
  holiday_date: Date | string | null;
  description: string;
  is_paid: boolean;
}

const EMPTY: FormValues = {
  name: '',
  holiday_date: null,
  description: '',
  is_paid: true,
};

export function HolidayFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  onSubmit,
  loading = false,
}: HolidayFormModalProps) {
  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      name: (v) => (!v?.trim() ? 'Name is required' : null),
      holiday_date: (v) => (!v ? 'Date is required' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (initialValues) {
        const datePart = initialValues.holiday_date.slice(0, 10);
        const [y, m, d] = datePart.split('-').map(Number);
        form.setValues({
          name: initialValues.name,
          holiday_date: new Date(y, m - 1, d),
          description: initialValues.description ?? '',
          is_paid: initialValues.is_paid,
        });
      } else {
        form.setValues(EMPTY);
      }
    }
  }, [opened]);

  const handleSubmit = async (values: FormValues) => {
    const payload: IHolidayPayload = {
      name: values.name.trim(),
      holiday_date: toDateOnly(values.holiday_date!)!,
      description: values.description?.trim() || undefined,
      is_paid: values.is_paid,
    };
    await onSubmit(payload, initialValues?.id);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT HOLIDAY' : 'ADD HOLIDAY'}
        </Text>
      }
      centered
      size="sm"
      styles={{ header: { padding: '5px 15px' }, body: { paddingTop: 10 } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="e.g. New Year's Day"
            required
            {...form.getInputProps('name')}
          />
          <DateInput
            label="Date"
            placeholder={DATE_FORMAT}
            valueFormat={DATE_FORMAT}
            required
            {...form.getInputProps('holiday_date')}
          />
          <Textarea
            label="Description"
            placeholder="Optional"
            autosize
            minRows={2}
            {...form.getInputProps('description')}
          />
          <Switch label="Paid holiday" {...form.getInputProps('is_paid', { type: 'checkbox' })} />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
