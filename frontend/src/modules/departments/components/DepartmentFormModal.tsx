import { Modal, Button, Group, TextInput, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { departmentValidationRules } from '../rule-form/department-validation';
import type { DepartmentFormValues } from '../types';

interface DepartmentFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: Partial<DepartmentFormValues>;
  departmentId?: string;
  onSubmit: (values: DepartmentFormValues, id?: string) => void | Promise<void>;
  loading?: boolean;
}

export function DepartmentFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  departmentId,
  onSubmit,
  loading = false,
}: DepartmentFormModalProps) {
  const form = useForm<DepartmentFormValues>({
    initialValues: {
      department_code: '',
      department_name: '',
      description: '',
    },
    validate: {
      department_code: departmentValidationRules.department_code,
      department_name: departmentValidationRules.department_name,
      description: departmentValidationRules.description,
    },
  });

  useEffect(() => {
    if (opened && initialValues) {
      form.setValues({
        department_code: initialValues.department_code || '',
        department_name: initialValues.department_name || '',
        description: initialValues.description || '',
      });
    }
  }, [opened, initialValues]);

  const handleSubmit = async (values: DepartmentFormValues) => {
    await onSubmit(values, departmentId);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c="deepPurple">
          {mode === 'edit' ? 'EDIT DEPARTMENT' : 'ADD DEPARTMENT'}
        </Text>
      }
      size="lg"
      centered
      styles={{
        header: {
          borderBottom: '2px solid #e9ecef',
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
            label="Department Code"
            placeholder="e.g., DEP-001"
            required
            disabled={mode === 'edit'}
            {...form.getInputProps('department_code')}
          />

          <TextInput
            label="Department Name"
            placeholder="Enter department name"
            required
            {...form.getInputProps('department_name')}
          />

          <Textarea
            label="Description"
            placeholder="Enter department description (optional)"
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
