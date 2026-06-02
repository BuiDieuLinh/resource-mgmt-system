import { useState } from 'react';
import { Stack, Group, Button, Badge, ActionIcon, Tooltip, Box, Text } from '@mantine/core';
import { IconPlus, IconEdit, IconShieldCheck } from '@tabler/icons-react';
import { notify } from '@/components/Notification';
import { formatDate } from '@/constant';
import { SettingRow, SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { SettingRowSkeleton } from '@/components/Skeleton/SettingRowSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useConfirm } from '@/hooks/useConfirm';
import { useGetWorkPolicies } from '../api/get-work-policies';
import { useCreateWorkPolicy } from '../api/create-work-policy';
import { useUpdateWorkPolicy } from '../api/update-work-policy';
import { WorkPolicyFormModal } from './WorkPolicyFormModal';
import { minutesToTime } from '../utils/time';
import type { IWorkPolicy, IWorkPolicyPayload, IWorkPolicyUpdatePayload } from '../types';
import { useTranslation } from 'react-i18next';

function isActive(p: IWorkPolicy) {
  const now = new Date();
  const from = new Date(p.effective_from);
  const to = p.effective_to ? new Date(p.effective_to) : null;
  return from <= now && (!to || to >= now);
}

export function WorkPolicySettings() {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [editPolicy, setEditPolicy] = useState<IWorkPolicy | null>(null);
  const { data, isLoading: _loading } = useGetWorkPolicies();
  const isLoading = useDelayedLoading(_loading);
  const createMutation = useCreateWorkPolicy();
  const updateMutation = useUpdateWorkPolicy();
  const policies = data?.data ?? [];
  const isEdit = Boolean(editPolicy);
  const { confirm, ConfirmComponent } = useConfirm();

  const submitConfirmed = async (
    payload: IWorkPolicyPayload | IWorkPolicyUpdatePayload,
    id?: string,
  ) => {
    const notiId = notify.loading(
      isEdit ? t('settings.workPolicies.updating') : t('settings.workPolicies.creating'),
    );
    try {
      if (isEdit && id) await updateMutation.mutateAsync({ id, payload });
      else await createMutation.mutateAsync(payload as IWorkPolicyPayload);
      notify.success(notiId, {
        message: isEdit
          ? t('settings.workPolicies.updateSuccess')
          : t('settings.workPolicies.createSuccess'),
      });
      setOpened(false);
      setEditPolicy(null);
    } catch (e: any) {
      notify.error(notiId, {
        message: e?.response?.data?.message || t('settings.workPolicies.saveFailed'),
      });
    }
  };

  const handleSubmit = async (
    payload: IWorkPolicyPayload | IWorkPolicyUpdatePayload,
    id?: string,
  ) => {
    confirm({
      title: isEdit
        ? t('settings.workPolicies.confirmUpdateTitle')
        : t('settings.workPolicies.confirmCreateTitle'),
      message: isEdit
        ? t('settings.workPolicies.confirmUpdateMessage')
        : t('settings.workPolicies.confirmCreateMessage'),
      confirmLabel: isEdit ? t('common.update') : t('common.save'),
      cancelLabel: t('common.cancel'),
      type: 'warning',
      onConfirm: () => submitConfirmed(payload, id),
    });
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>{t('settings.workPolicies.title')}</SectionLabel>
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
            onClick={() => {
              setEditPolicy(null);
              setOpened(true);
            }}
          >
            {t('settings.workPolicies.addPolicy')}
          </Button>
        }
      >
        {t('settings.workPolicies.title')}
      </SectionLabel>

      <SettingsCard>
        {policies.length === 0 ? (
          <Box py="xl" ta="center">
            <IconShieldCheck size={30} color="#adb5bd" style={{ margin: '0 auto 6px' }} />
            <Text size="sm" c="dimmed">
              {t('settings.workPolicies.noPolicies')}
            </Text>
          </Box>
        ) : (
          policies.map((p, i) => {
            const active = isActive(p);
            const breakText =
              p.break_start != null && p.break_end != null
                ? `${minutesToTime(p.break_start)} – ${minutesToTime(p.break_end)}`
                : t('settings.workPolicies.noBreak');
            const flexText = p.is_flexible_enabled
              ? `+${p.flexible_start ?? 0} / -${p.flexible_end ?? 0} min`
              : t('settings.workPolicies.disabled');
            const cutoffText =
              p.check_in_cutoff_minutes != null
                ? t('settings.workPolicies.checkInCutoffValue', {
                    count: p.check_in_cutoff_minutes,
                  })
                : t('settings.workPolicies.noCheckInCutoff');
            const geoText =
              p.office_latitude != null && p.office_longitude != null
                ? `GPS ≤${p.max_distance_meters ?? 100}m`
                : t('settings.workPolicies.noGeoFence');
            const dateRange = `${formatDate(p.effective_from)} – ${p.effective_to ? formatDate(p.effective_to) : t('settings.workPolicies.ongoing')}`;

            return (
              <SettingRow
                key={p.id}
                icon={<IconShieldCheck size={16} />}
                color={active ? 'green' : 'gray'}
                title={dateRange}
                description={t('settings.workPolicies.activeRange', {
                  break: breakText,
                  flex: flexText,
                  cutoff: cutoffText,
                  geo: geoText,
                })}
                noDivider={i === policies.length - 1}
                right={
                  <Group gap={6} wrap="nowrap">
                    <Badge size="xs" variant="dot" color={active ? 'green' : 'gray'} radius="sm">
                      {active ? t('common.active') : t('common.inactive')}
                    </Badge>
                    <Tooltip label={t('common.edit')} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        disabled={!active}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!active) return;
                          setEditPolicy(p);
                          setOpened(true);
                        }}
                      >
                        <IconEdit size={15} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
              />
            );
          })
        )}
      </SettingsCard>

      <WorkPolicyFormModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditPolicy(null);
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={editPolicy}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmComponent />
    </Stack>
  );
}
