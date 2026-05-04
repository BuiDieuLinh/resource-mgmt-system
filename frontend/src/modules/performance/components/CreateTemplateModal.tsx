import { useEffect } from 'react';
import { PRIMARY_COLOR } from '@/theme';
import {
  Modal,
  Stack,
  Group,
  Button,
  TextInput,
  MultiSelect,
  ActionIcon,
  NumberInput,
  Divider,
  Alert,
  Badge,
  Select,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { CONTRACT_TYPE_OPTIONS, SCORE_TYPE_OPTIONS } from '@/constant';
import type { IEvaluationTemplate, CriteriaFormValues } from '../types';

const DEFAULT_CRITERIA: CriteriaFormValues[] = [
  { criterion: 'Work Quality', weight: 25, max_score: 5, score_type: 'rating' },
  { criterion: 'Productivity', weight: 20, max_score: 5, score_type: 'rating' },
  { criterion: 'Teamwork', weight: 20, max_score: 5, score_type: 'rating' },
  { criterion: 'Communication', weight: 15, max_score: 5, score_type: 'rating' },
  { criterion: 'Punctuality', weight: 20, max_score: 5, score_type: 'rating' },
];

interface CreateTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateFormState) => Promise<void>;
  isLoading: boolean;
  mode?: 'add' | 'edit';
  initialValues?: IEvaluationTemplate | null;
}

interface TemplateFormState {
  title: string;
  description: string;
  apply_to: string[];
  criteria: CriteriaFormValues[];
}

export function CreateTemplateModal({
  opened,
  onClose,
  onSubmit,
  isLoading,
  mode = 'add',
  initialValues,
}: CreateTemplateModalProps) {
  const form = useForm<TemplateFormState>({
    initialValues: {
      title: '',
      description: '',
      apply_to: [],
      criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
    },
    validate: {
      title: (v) => (!v?.trim() ? 'Required' : null),
    },
  });

  useEffect(() => {
    if (!opened) return;

    if (mode === 'edit' && initialValues) {
      form.setValues({
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
        apply_to: initialValues.apply_to ?? [],
        criteria:
          initialValues.criteria && initialValues.criteria.length > 0
            ? initialValues.criteria.map((c) => ({
                id: c.id,
                criterion: c.criterion,
                weight: c.weight,
                max_score: c.max_score,
                score_type: c.score_type,
              }))
            : DEFAULT_CRITERIA.map((c) => ({ ...c })),
      });
    } else {
      form.reset();
    }
  }, [opened, mode, initialValues]);

  const handleSubmit = async (values: TemplateFormState) => {
    const totalWeight = values.criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
    if (totalWeight !== 100) return;
    await onSubmit(values);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const totalWeight = form.values.criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
  const isWeightValid = totalWeight === 100;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c={PRIMARY_COLOR}>
          {mode === 'edit' ? 'EDIT EVALUATION TEMPLATE' : 'ADD EVALUATION TEMPLATE'}
        </Text>
      }
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="e.g. Probation Evaluation"
            required
            {...form.getInputProps('title')}
          />
          <TextInput
            label="Description"
            placeholder="Purpose of this template"
            {...form.getInputProps('description')}
          />
          <MultiSelect
            label="Apply To"
            placeholder="Select contract types (leave empty for all)"
            data={CONTRACT_TYPE_OPTIONS}
            clearable
            {...form.getInputProps('apply_to')}
          />

          <Divider label="Evaluation Criteria" labelPosition="center" />

          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Total Weight:
            </Text>
            <Badge size="lg" color={isWeightValid ? 'green' : 'red'}>
              {totalWeight}%
            </Badge>
          </Group>

          {!isWeightValid && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              Total weight must equal 100%. Current: {totalWeight}%
            </Alert>
          )}

          <Stack gap={6}>
            {form.values.criteria.map((_, index) => (
              <Group key={index} align="center" gap={6} wrap="nowrap">
                <TextInput
                  placeholder="Criterion name"
                  required
                  size="xs"
                  style={{ flex: 1, minWidth: 0 }}
                  styles={{ input: { height: 32 } }}
                  {...form.getInputProps(`criteria.${index}.criterion`)}
                />
                <NumberInput
                  placeholder="Weight %"
                  min={1}
                  max={100}
                  required
                  size="xs"
                  style={{ width: 85 }}
                  styles={{ input: { height: 32 } }}
                  {...form.getInputProps(`criteria.${index}.weight`)}
                />
                <NumberInput
                  placeholder="Max"
                  min={1}
                  max={10}
                  required
                  size="xs"
                  style={{ width: 65 }}
                  styles={{ input: { height: 32 } }}
                  {...form.getInputProps(`criteria.${index}.max_score`)}
                />
                <Select
                  data={SCORE_TYPE_OPTIONS}
                  required
                  size="xs"
                  style={{ width: 95 }}
                  styles={{ input: { height: 32 } }}
                  {...form.getInputProps(`criteria.${index}.score_type`)}
                />
                {form.values.criteria.length > 1 && (
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="xs"
                    style={{ minWidth: 28, height: 28 }}
                    onClick={() => {
                      const next = [...form.values.criteria];
                      next.splice(index, 1);
                      form.setFieldValue('criteria', next);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Stack>

          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={12} />}
            onClick={() =>
              form.insertListItem('criteria', {
                criterion: '',
                weight: 10,
                max_score: 5,
                score_type: 'rating' as const,
              } satisfies CriteriaFormValues)
            }
          >
            Add Criterion
          </Button>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading} disabled={!isWeightValid}>
              {mode === 'edit' ? 'Save Changes' : 'Create Template'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
