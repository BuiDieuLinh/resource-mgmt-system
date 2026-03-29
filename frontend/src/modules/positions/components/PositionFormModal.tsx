import { Modal, Button, Group, TextInput, Select, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMemo, useEffect } from 'react';
import { positionValidationRules } from '../rule-form/position-validation';
import type { PositionFormValues } from '../types';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { PRIMARY_COLOR } from '@/theme';
import { LEVEL_OPTIONS } from '@/constant';

interface PositionFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: Partial<PositionFormValues>;
  positionId?: string;
  onSubmit: (values: PositionFormValues, id?: string) => void | Promise<void>;
  loading?: boolean;
}

export function PositionFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  positionId,
  onSubmit,
  loading = false,
}: PositionFormModalProps) {
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useGetAllDepartments();

  const form = useForm<PositionFormValues>({
    initialValues: {
      position_name: '',
      level: '',
      description: '',
      department_id: '',
    },
    validate: {
      position_name: positionValidationRules.position_name,
      level: positionValidationRules.level,
      description: positionValidationRules.description,
      department_id: positionValidationRules.department_id,
    },
  });

  useEffect(() => {
    if (opened && initialValues) {
      form.setValues({
        position_name: initialValues.position_name || '',
        level: initialValues.level || '',
        description: initialValues.description || '',
        department_id: initialValues.department_id || '',
      });
    }
  }, [opened, initialValues]);

  const handleSubmit = async (values: PositionFormValues) => {
    await onSubmit(values, positionId);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const departmentOptions = useMemo(() => {
    if (!departmentsData?.data) return [];
    return departmentsData.data.map((dept) => ({
      value: dept.id,
      label: dept.department_name,
    }));
  }, [departmentsData]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT POSITION' : 'ADD POSITION'}
        </Text>
      }
      size="lg"
      centered
      styles={{
        header: {
          padding: '5px 15px',
        },
        body: {
          paddingTop: '10px',
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Position Name"
            placeholder="e.g., Senior Developer"
            required
            {...form.getInputProps('position_name')}
          />

          <Select
            checkIconPosition="right"
            label="Level"
            placeholder="Select level"
            data={LEVEL_OPTIONS}
            required
            {...form.getInputProps('level')}
          />

          <Select
            checkIconPosition="right"
            label="Department"
            placeholder="Select department"
            required
            data={departmentOptions}
            searchable
            disabled={isDepartmentsLoading}
            {...form.getInputProps('department_id')}
          />

          <Textarea
            label="Description"
            placeholder="Enter position description (optional)"
            rows={3}
            {...form.getInputProps('description')}
          />
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
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
