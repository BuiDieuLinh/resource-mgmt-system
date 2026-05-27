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
import { useConfirm } from '@/hooks/useConfirm';
import { useGetTemplates, useCreateTemplate, useUpdateTemplate, useToggleTemplate } from '../api';
import { CreateTemplateModal } from '../components/CreateTemplateModal';
import { notify } from '@/components/Notification';
import type { IEvaluationTemplate } from '../types';
import { CONTRACT_TYPE_COLOR, CONTRACT_TYPE_LABEL } from '@/constant';
import { useTranslation } from 'react-i18next';

export default function EvaluationTemplatesPage() {
  const { t } = useTranslation();
  const { data: templates = [], isLoading: _loading } = useGetTemplates();
  const isLoading = useDelayedLoading(_loading);

  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTemplate, setEditingTemplate] = useState<IEvaluationTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { confirm, ConfirmComponent } = useConfirm();

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
    const nid = notify.loading(t('performance.creatingTemplate'));
    try {
      await createTemplate.mutateAsync({
        title: values.title,
        description: values.description,
        apply_to: values.apply_to.length > 0 ? values.apply_to : [],
        criteria: values.criteria,
      });
      notify.success(nid, { message: t('performance.templateCreated') });
      setModalOpened(false);
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('performance.templateCreateFailed'),
      });
      throw e;
    }
  };

  const handleEdit = async (values: any) => {
    if (!editingTemplate) return;
    const nid = notify.loading(t('performance.savingTemplate'));
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        title: values.title,
        description: values.description,
        apply_to: values.apply_to.length > 0 ? values.apply_to : [],
        criteria: values.criteria,
      });
      notify.success(nid, { message: t('performance.templateUpdated') });
      setModalOpened(false);
      setEditingTemplate(null);
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('performance.templateSaveFailed'),
      });
      throw e;
    }
  };

  const handleToggle = (id: string, isActive: boolean, title: string) => {
    confirm({
      title: isActive ? t('performance.deactivateTemplate') : t('performance.activateTemplate'),
      message: isActive
        ? t('performance.deactivateTemplateMessage', { title })
        : t('performance.activateTemplateMessage', { title }),
      confirmLabel: isActive
        ? t('performance.deactivateTemplate')
        : t('performance.activateTemplate'),
      cancelLabel: t('common.cancel'),
      type: isActive ? 'warning' : 'info',
      onConfirm: async () => {
        const nid = notify.loading(t('settings.workPolicies.updating'));
        try {
          await toggleTemplate.mutateAsync(id);
          notify.success(nid, { message: t('performance.statusUpdated') });
        } catch (e: any) {
          notify.error(nid, {
            message: e?.response?.data?.message || t('performance.updateFailed'),
          });
        }
      },
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>{t('performance.templatesTitle')}</SectionLabel>
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
            {t('performance.newTemplate')}
          </Button>
        }
      >
        {t('performance.templatesTitle')}
      </SectionLabel>

      <SettingsCard>
        {templates.length === 0 ? (
          <Box py="xl" ta="center">
            <IconTemplate size={30} color="#adb5bd" style={{ margin: '0 auto 6px' }} />
            <Text size="sm" c="dimmed">
              {t('performance.noTemplates')}
            </Text>
          </Box>
        ) : (
          templates.map((template: IEvaluationTemplate, i) => {
            const isExpanded = expandedId === template.id;
            const isLast = i === templates.length - 1;

            const applyToBadges =
              template.apply_to && template.apply_to.length > 0 ? (
                <Group gap={4}>
                  {template.apply_to.map((type) => (
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
                  {t('performance.allTypes')}
                </Badge>
              );

            const criteriaCount = template._count?.criteria ?? template.criteria?.length ?? 0;

            return (
              <Box key={template.id}>
                {/* Main row */}
                <Group
                  justify="space-between"
                  align="center"
                  py="sm"
                  px="md"
                  wrap="nowrap"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(template.id)}
                >
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon
                      variant="light"
                      color={template.is_active ? 'blue' : 'gray'}
                      size="md"
                      radius="sm"
                      style={{ flexShrink: 0 }}
                    >
                      <IconTemplate size={16} />
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} lh={1.3}>
                        {template.title}
                      </Text>
                      <Group gap={6} mt={2} wrap="nowrap">
                        {applyToBadges}
                        <Text size="xs" c="dimmed">
                          · {t('performance.criteriaCount', { count: criteriaCount })}
                        </Text>
                      </Group>
                    </Box>
                  </Group>

                  <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Badge
                      size="xs"
                      variant="dot"
                      color={template.is_active ? 'green' : 'gray'}
                      radius="sm"
                    >
                      {template.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                    {template._count?.cycles != null && (
                      <Badge size="xs" variant="light" color="gray" radius="sm">
                        {template._count.cycles} cycles
                      </Badge>
                    )}
                    <Tooltip label={t('common.edit')} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(template);
                        }}
                      >
                        <IconEdit size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={
                        template.is_active
                          ? t('performance.deactivateTemplate')
                          : t('performance.activateTemplate')
                      }
                      withArrow
                    >
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={template.is_active ? 'red' : 'green'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(template.id, template.is_active, template.title);
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
                        toggleExpand(template.id);
                      }}
                    >
                      {isExpanded ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={isExpanded}>
                  <Box px="md" pb="sm" style={{ background: 'var(--mantine-color-gray-0)' }}>
                    {template.description && (
                      <Text size="xs" c="dimmed" mb="sm">
                        {template.description}
                      </Text>
                    )}

                    {template.criteria && template.criteria.length > 0 ? (
                      <Stack gap={4}>
                        <Group justify="space-between" mb={4}>
                          <Group gap={6}>
                            <IconListCheck size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                              {t('performance.criteria')}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {t('performance.totalWeight')}:{' '}
                            <Text
                              span
                              fw={600}
                              c={
                                template.criteria.reduce((s, c) => s + c.weight, 0) === 100
                                  ? 'green'
                                  : 'red'
                              }
                            >
                              {template.criteria.reduce((s, c) => s + c.weight, 0)}%
                            </Text>
                          </Text>
                        </Group>

                        {template.criteria.map((c, idx) => (
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
                                {t('performance.maxScore', { count: c.max_score })}
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
                        {t('performance.noCriteria')}
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

      <ConfirmComponent />
    </Stack>
  );
}
