import { Modal, Button, Group, TextInput, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { getDepartmentValidationRules } from '../rule-form/department-validation';
import type { DepartmentFormValues } from '../types';
import { PRIMARY_COLOR } from '@/theme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const departmentValidationRules = getDepartmentValidationRules(t);
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
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit'
            ? t('department.modal.editDepartment')
            : t('department.modal.addDepartment')}
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
            label={t('department.code')}
            placeholder={t('department.modal.departmentCodePlaceholder')}
            required
            disabled={mode === 'edit'}
            {...form.getInputProps('department_code')}
          />

          <TextInput
            label={t('department.name')}
            placeholder={t('department.modal.departmentNamePlaceholder')}
            required
            {...form.getInputProps('department_name')}
          />

          <Textarea
            label={t('department.description')}
            placeholder={t('department.modal.descriptionPlaceholder')}
            rows={3}
            {...form.getInputProps('description')}
          />
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'edit' ? t('common.update') : t('common.add')}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
