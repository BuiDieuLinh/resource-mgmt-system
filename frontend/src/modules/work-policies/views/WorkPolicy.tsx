import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  Card,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Box,
  SimpleGrid,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconCoffee,
  IconCalendar,
  IconCheck,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useGetWorkPolicies } from '../api/get-work-policies';
import { useCreateWorkPolicy } from '../api/create-work-policy';
import { useUpdateWorkPolicy } from '../api/update-work-policy';
import { useDeleteWorkPolicy } from '../api/delete-work-policy';
import { WorkPolicyFormModal } from '../components/WorkPolicyFormModal';
import { notify } from '@/components/Notification';
import { Loading } from '@/components/Loading/Loading';
import ErrorState from '@/components/ErrorState/ErrorState';
import { minutesToTime } from '../utils/time';
import type { IWorkPolicy, IWorkPolicyPayload } from '../types';
import { PRIMARY_COLOR } from '@/theme';

function isActive(policy: IWorkPolicy): boolean {
  const now = new Date();
  const from = new Date(policy.effective_from);
  const to = policy.effective_to ? new Date(policy.effective_to) : null;
  return from <= now && (!to || to >= now);
}

function PolicyCard({
  policy,
  onEdit,
  onDelete,
}: {
  policy: IWorkPolicy;
  onEdit: (p: IWorkPolicy) => void;
  onDelete: (id: string) => void;
}) {
  const active = isActive(policy);

  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Group gap={8}>
          <ThemeIcon size={32} radius="md" variant="light" color={active ? 'violet' : 'gray'}>
            <IconShieldCheck size={18} />
          </ThemeIcon>
          <Box>
            <Text size="sm" fw={600}>
              {new Date(policy.effective_from).toLocaleDateString('vi-VN')}
              {' → '}
              {policy.effective_to
                ? new Date(policy.effective_to).toLocaleDateString('vi-VN')
                : '∞'}
            </Text>
            <Badge size="xs" color={active ? 'green' : 'gray'} variant="light">
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </Box>
        </Group>
        <Group gap={4}>
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" color="gray" onClick={() => onEdit(policy)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" onClick={() => onDelete(policy.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <SimpleGrid cols={2} spacing="xs" mt="sm">
        {/* Break time */}
        <Group gap={6} align="flex-start">
          <ThemeIcon size={24} radius="sm" variant="light" color="orange">
            <IconCoffee size={14} />
          </ThemeIcon>
          <Box>
            <Text size="xs" c="dimmed">
              Break
            </Text>
            <Text size="sm" fw={500}>
              {policy.break_start != null && policy.break_end != null
                ? `${minutesToTime(policy.break_start)} – ${minutesToTime(policy.break_end)}`
                : '—'}
            </Text>
          </Box>
        </Group>

        {/* Flexible */}
        <Group gap={6} align="flex-start">
          <ThemeIcon
            size={24}
            radius="sm"
            variant="light"
            color={policy.is_flexible_enabled ? 'violet' : 'gray'}
          >
            <IconClock size={14} />
          </ThemeIcon>
          <Box>
            <Text size="xs" c="dimmed">
              Flexible
            </Text>
            {policy.is_flexible_enabled &&
            (policy.flexible_start_minutes != null || policy.flexible_end_minutes != null) ? (
              <Text size="sm" fw={500}>
                In +{policy.flexible_start_minutes ?? 0}m / Out -{policy.flexible_end_minutes ?? 0}m
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                Disabled
              </Text>
            )}
          </Box>
        </Group>
      </SimpleGrid>
    </Card>
  );
}

export default function WorkPolicyPage() {
  const [opened, setOpened] = useState(false);
  const [editPolicy, setEditPolicy] = useState<IWorkPolicy | null>(null);

  const { data, isLoading, error, refetch } = useGetWorkPolicies();
  const createMutation = useCreateWorkPolicy();
  const updateMutation = useUpdateWorkPolicy();
  const deleteMutation = useDeleteWorkPolicy();

  const policies = data?.data ?? [];
  const isEdit = Boolean(editPolicy);

  const handleAdd = () => {
    setEditPolicy(null);
    setOpened(true);
  };
  const handleEdit = (p: IWorkPolicy) => {
    setEditPolicy(p);
    setOpened(true);
  };

  const handleDelete = async (id: string) => {
    const notiId = notify.loading('Deleting policy...');
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(notiId, { message: 'Policy deleted' });
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Delete failed' });
    }
  };

  const handleSubmit = async (payload: IWorkPolicyPayload, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating policy...' : 'Creating policy...');
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      notify.success(notiId, { message: isEdit ? 'Policy updated' : 'Policy created' });
      setOpened(false);
      setEditPolicy(null);
    } catch (e: any) {
      notify.error(notiId, { message: e?.response?.data?.message || 'Save failed' });
    }
  };

  if (error)
    return <ErrorState message={`Error loading policies: ${error.message}`} onRetry={refetch} />;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap={8}>
          <ThemeIcon size={36} radius="md" variant="light" color="violet">
            <IconShieldCheck size={20} />
          </ThemeIcon>
          <Box>
            <Text size="lg" fw={700}>
              Work Policies
            </Text>
            <Text size="xs" c="dimmed">
              Configure break time, flexible check-in, and effective periods
            </Text>
          </Box>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
          Add Policy
        </Button>
      </Group>

      {isLoading ? (
        <Loading />
      ) : policies.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="sm">
            <IconCalendar size={24} />
          </ThemeIcon>
          <Text c="dimmed">No work policies yet. Add one to get started.</Text>
          <Button mt="md" variant="light" leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Add Policy
          </Button>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {policies.map((p) => (
            <PolicyCard key={p.id} policy={p} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </SimpleGrid>
      )}

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
