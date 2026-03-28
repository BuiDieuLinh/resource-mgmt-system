import { useState } from 'react';
import { Stack, Group, Button, Badge, ActionIcon, Tooltip, Box, Text } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconShieldCheck } from '@tabler/icons-react';
import { notify } from '@/components/Notification';
import { formatDate } from '@/constant';
import { SettingRow, SettingsCard, SectionLabel } from '@/components/SettingsUI';
import { SettingRowSkeleton } from '@/components/Skeleton/SettingRowSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useGetWorkPolicies } from '../api/get-work-policies';
import { useCreateWorkPolicy } from '../api/create-work-policy';
import { useUpdateWorkPolicy } from '../api/update-work-policy';
import { useDeleteWorkPolicy } from '../api/delete-work-policy';
import { WorkPolicyFormModal } from './WorkPolicyFormModal';
import { minutesToTime } from '../utils/time';
import type { IWorkPolicy, IWorkPolicyPayload } from '../types';

function isActive(p: IWorkPolicy) {
  const now = new Date();
  const from = new Date(p.effective_from);
  const to = p.effective_to ? new Date(p.effective_to) : null;
  return from <= now && (!to || to >= now);
}

export function WorkPolicySettings() {
  const [opened, setOpened] = useState(false);
  const [editPolicy, setEditPolicy] = useState<IWorkPolicy | null>(null);
  const { data, isLoading: _loading } = useGetWorkPolicies();
  const isLoading = useDelayedLoading(_loading);
  const createMutation = useCreateWorkPolicy();
  const updateMutation = useUpdateWorkPolicy();
  const deleteMutation = useDeleteWorkPolicy();
  const policies = data?.data ?? [];
  const isEdit = Boolean(editPolicy);

  const handleDelete = async (id: string) => {
    const notiId = notify.loading('Deleting...');
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(notiId, { message: 'Policy deleted' });
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
    }
  };

  const handleSubmit = async (payload: IWorkPolicyPayload, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating...' : 'Creating...');
    try {
      if (isEdit && id) await updateMutation.mutateAsync({ id, payload });
      else await createMutation.mutateAsync(payload);
      notify.success(notiId, { message: isEdit ? 'Policy updated' : 'Policy created' });
      setOpened(false);
      setEditPolicy(null);
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Save failed' });
    }
  };

  if (isLoading)
    return (
      <Stack gap="md">
        <SectionLabel>Work Policies</SectionLabel>
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
            leftSection={<IconPlus size={13} />}
            onClick={() => {
              setEditPolicy(null);
              setOpened(true);
            }}
          >
            Add policy
          </Button>
        }
      >
        Work Policies
      </SectionLabel>

      <SettingsCard>
        {policies.length === 0 ? (
          <Box py="xl" ta="center">
            <IconShieldCheck size={28} color="#adb5bd" style={{ margin: '0 auto 6px' }} />
            <Text size="sm" c="dimmed">
              No policies configured
            </Text>
          </Box>
        ) : (
          policies.map((p, i) => {
            const active = isActive(p);
            const breakText =
              p.break_start != null && p.break_end != null
                ? `${minutesToTime(p.break_start)} – ${minutesToTime(p.break_end)}`
                : 'No break';
            const flexText = p.is_flexible_enabled
              ? `+${p.flexible_start ?? 0} / -${p.flexible_end ?? 0} min`
              : 'Disabled';

            return (
              <SettingRow
                key={p.id}
                icon={<IconShieldCheck size={14} />}
                color={active ? 'green' : 'gray'}
                title={`${formatDate(p.effective_from)} – ${p.effective_to ? formatDate(p.effective_to) : 'ongoing'}`}
                description={`Break: ${breakText}  ·  Flex: ${flexText}`}
                noDivider={i === policies.length - 1}
                right={
                  <Group gap={6} wrap="nowrap">
                    <Badge size="xs" variant="dot" color={active ? 'green' : 'gray'} radius="sm">
                      {active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Tooltip label="Edit" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditPolicy(p);
                          setOpened(true);
                        }}
                      >
                        <IconEdit size={13} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                      >
                        <IconTrash size={13} />
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
    </Stack>
  );
}
