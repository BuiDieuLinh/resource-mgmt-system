import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  ActionIcon,
  Tooltip,
  Box,
  Collapse,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import {
  IconPlus,
  IconEyeOff,
  IconEdit,
  IconTemplate,
  IconChevronDown,
  IconChevronRight,
  IconListCheck,
} from '@tabler/icons-react';
import { SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { SettingRowSkeleton } from '@/components/Skeleton/SettingRowSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useGetTemplates, useCreateTemplate, useUpdateTemplate, useToggleTemplate } from '../api';
import { CreateTemplateModal } from '../components/CreateTemplateModal';
import { notify } from '@/components/Notification';
import type { IEvaluationTemplate } from '../types';
import { CONTRACT_TYPE_COLOR, CONTRACT_TYPE_LABEL } from '@/constant';

export default function EvaluationTemplatesPage() {
  const { data: templates = [], isLoading: _loading } = useGetTemplates();
  const isLoading = useDelayedLoading(_loading);

  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTemplate, setEditingTemplate] = useState<IEvaluationTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const toggleTemplate = useToggleTemplate();

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  const openCreate = () => {
    setEditingTemplate(null);
    setModalMode('add');
    setModalOpened(true);
  };

  const openEdit = (t: IEvaluationTemplate) => {
    setEditingTemplate(t);
    setModalMode('edit');
    setModalOpened(true);
  };

  const handleCreate = async (values: any) => {
    const nid = notify.loading('Creating template...');
    try {
      await createTemplate.mutateAsync({
        title: values.title,
        description: values.description,
        apply_to: values.apply_to.length > 0 ? values.apply_to : [],
        criteria: values.criteria,
      });
      notify.success(nid, { message: 'Template created' });
      setModalOpened(false);
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to create' });
      throw e;
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingTemplate) return;
    const nid = notify.loading('Saving changes...');
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        title: values.title,
        description: values.description,
        apply_to: values.apply_to.length > 0 ? values.apply_to : [],
        criteria: values.criteria,
      });
      notify.success(nid, { message: 'Template updated' });
      setModalOpened(false);
      setEditingTemplate(null);
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to save' });
      throw e;
    }
  };

  const handleToggle = async (id: string) => {
    const nid = notify.loading('Updating...');
    try {
      await toggleTemplate.mutateAsync(id);
      notify.success(nid, { message: 'Status updated' });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to update' });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>Evaluation Templates</SectionLabel>
        <SettingRowSkeleton rows={3} />
      </Stack>
    );

  return (
    <Stack gap="md">
      <SectionLabel
        action={
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={15} />}
            onClick={openCreate}
          >
            New Template
          </Button>
        }
      >
        Evaluation Templates
      </SectionLabel>

      <SettingsCard>
        {templates.length === 0 ? (
          <Box py="xl" ta="center">
            <IconTemplate size={30} color="#adb5bd" style={{ margin: '0 auto 6px' }} />
            <Text size="sm" c="dimmed">
              No templates yet
            </Text>
          </Box>
        ) : (
          templates.map((t: IEvaluationTemplate, i) => {
            const isExpanded = expandedId === t.id;
            const isLast = i === templates.length - 1;

            const applyToBadges =
              t.apply_to && t.apply_to.length > 0 ? (
                <Group gap={4}>
                  {t.apply_to.map((type) => (
                    <Badge
                      key={type}
                      size="xs"
                      variant="light"
                      fw={500}
                      color={CONTRACT_TYPE_COLOR[type] ?? 'gray'}
                    >
                      {CONTRACT_TYPE_LABEL[type] ?? type}
                    </Badge>
                  ))}
                </Group>
              ) : (
                <Badge size="xs" variant="light" color="gray" fw={500}>
                  All types
                </Badge>
              );

            const criteriaCount = t._count?.criteria ?? t.criteria?.length ?? 0;

            return (
              <Box key={t.id}>
                {/* Main row */}
                <Group
                  justify="space-between"
                  align="center"
                  py="sm"
                  px="md"
                  wrap="nowrap"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(t.id)}
                >
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon
                      variant="light"
                      color={t.is_active ? 'blue' : 'gray'}
                      size="md"
                      radius="sm"
                      style={{ flexShrink: 0 }}
                    >
                      <IconTemplate size={16} />
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} lh={1.3}>
                        {t.title}
                      </Text>
                      <Group gap={6} mt={2} wrap="nowrap">
                        {applyToBadges}
                        <Text size="xs" c="dimmed">
                          · {criteriaCount} criteria
                        </Text>
                      </Group>
                    </Box>
                  </Group>

                  <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Badge
                      size="xs"
                      variant="dot"
                      color={t.is_active ? 'green' : 'gray'}
                      radius="sm"
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {t._count?.cycles != null && (
                      <Badge size="xs" variant="light" color="gray" radius="sm">
                        {t._count.cycles} cycles
                      </Badge>
                    )}
                    <Tooltip label="Edit" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(t);
                        }}
                      >
                        <IconEdit size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t.is_active ? 'Deactivate' : 'Activate'} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={t.is_active ? 'red' : 'green'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(t.id);
                        }}
                      >
                        <IconEyeOff size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(t.id);
                      }}
                    >
                      {isExpanded ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={isExpanded}>
                  <Box px="md" pb="sm" style={{ background: 'var(--mantine-color-gray-0)' }}>
                    {t.description && (
                      <Text size="xs" c="dimmed" mb="sm">
                        {t.description}
                      </Text>
                    )}

                    {t.criteria && t.criteria.length > 0 ? (
                      <Stack gap={4}>
                        <Group justify="space-between" mb={4}>
                          <Group gap={6}>
                            <IconListCheck size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                              Criteria
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            Total weight:{' '}
                            <Text
                              span
                              fw={600}
                              c={
                                t.criteria.reduce((s, c) => s + c.weight, 0) === 100
                                  ? 'green'
                                  : 'red'
                              }
                            >
                              {t.criteria.reduce((s, c) => s + c.weight, 0)}%
                            </Text>
                          </Text>
                        </Group>

                        {t.criteria.map((c, idx) => (
                          <Group
                            key={c.id}
                            justify="space-between"
                            align="center"
                            py={6}
                            px="sm"
                            style={{
                              background: 'var(--mantine-color-white)',
                              borderRadius: 6,
                              border: '1px solid var(--mantine-color-gray-2)',
                            }}
                          >
                            <Text size="xs" fw={500}>
                              {idx + 1}. {c.criterion}
                            </Text>
                            <Group gap={6}>
                              <Badge size="xs" variant="light" color="blue">
                                {c.weight}%
                              </Badge>
                              <Badge size="xs" variant="light" color="gray">
                                max {c.max_score}
                              </Badge>
                              <Badge size="xs" variant="outline" color="gray">
                                {c.score_type}
                              </Badge>
                            </Group>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="xs" c="dimmed">
                        No criteria defined
                      </Text>
                    )}
                  </Box>
                </Collapse>

                {!isLast && <Divider />}
              </Box>
            );
          })
        )}
      </SettingsCard>

      <CreateTemplateModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingTemplate(null);
        }}
        onSubmit={modalMode === 'edit' ? handleEdit : handleCreate}
        isLoading={isSaving}
        mode={modalMode}
        initialValues={editingTemplate}
      />
    </Stack>
  );
}
