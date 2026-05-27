import { Modal, Button, Group, TextInput, Select, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMemo, useEffect } from 'react';
import { getPositionValidationRules } from '../rule-form/position-validation';
import type { PositionFormValues } from '../types';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { PRIMARY_COLOR } from '@/theme';
import { LEVEL_OPTIONS } from '@/constant';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useGetAllDepartments();
  const positionValidationRules = getPositionValidationRules(t);

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
          {mode === 'edit' ? t('position.modal.editPosition') : t('position.modal.addPosition')}
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
            label={t('position.positionName')}
            placeholder={t('position.modal.positionNamePlaceholder')}
            required
            {...form.getInputProps('position_name')}
          />

          <Select
            checkIconPosition="right"
            label={t('position.level')}
            placeholder={t('position.modal.levelPlaceholder')}
            data={LEVEL_OPTIONS}
            required
            {...form.getInputProps('level')}
          />

          <Select
            checkIconPosition="right"
            label={t('position.department')}
            placeholder={t('position.modal.departmentPlaceholder')}
            required
            data={departmentOptions}
            searchable
            disabled={isDepartmentsLoading}
            {...form.getInputProps('department_id')}
          />

          <Textarea
            label={t('position.description')}
            placeholder={t('position.modal.descriptionPlaceholder')}
            rows={3}
            {...form.getInputProps('description')}
          />
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'edit' ? t('common.update') : t('common.save')}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
