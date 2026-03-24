import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  Card,
  ActionIcon,
  Tooltip,
  Box,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconCoffee,
  IconCalendar,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
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

function isActive(policy: IWorkPolicy): boolean {
  const now = new Date();
  const from = new Date(policy.effective_from);
  const to = policy.effective_to ? new Date(policy.effective_to) : null;
  return from <= now && (!to || to >= now);
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Group gap={10} wrap="nowrap">
      <Box c="dimmed" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" lh={1.2}>
          {label}
        </Text>
        <Text size="sm" fw={500} lh={1.4}>
          {value}
        </Text>
      </Box>
    </Group>
  );
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
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Box
        px="md"
        py="sm"
        style={{
          background: active ? 'linear-gradient(135deg, #7c3aed18 0%, #7c3aed08 100%)' : '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap={8} wrap="nowrap">
            <Badge size="sm" variant="dot" color={active ? 'green' : 'gray'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
            <Text size="xs" c="dimmed">
              <IconCalendar size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {new Date(policy.effective_from).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              {' — '}
              {policy.effective_to
                ? new Date(policy.effective_to).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'No end date'}
            </Text>
          </Group>
          <Group gap={2}>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onEdit(policy)}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(policy.id)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      <Stack gap="xs" p="md">
        <InfoRow
          icon={<IconCoffee size={15} />}
          label="Break time"
          value={
            policy.break_start != null && policy.break_end != null
              ? `${minutesToTime(policy.break_start)} – ${minutesToTime(policy.break_end)}`
              : '—'
          }
        />

        <Divider />

        <InfoRow
          icon={<IconClock size={15} />}
          label="Flexible check-in / check-out"
          value={
            policy.is_flexible_enabled ? (
              <Group gap={6}>
                <Badge size="xs" color="violet" variant="light">
                  In +{policy.flexible_start ?? 0} min
                </Badge>
                <Badge size="xs" color="violet" variant="light">
                  Out -{policy.flexible_end ?? 0} min
                </Badge>
              </Group>
            ) : (
              <Group gap={4}>
                <IconX size={13} color="gray" />
                <Text size="sm" c="dimmed">
                  Disabled
                </Text>
              </Group>
            )
          }
        />
      </Stack>
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
    const notiId = notify.loading(isEdit ? 'Updating...' : 'Creating...');
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
      <PageHeader
        title="Work Policies"
        description="Configure break time, flexible grace windows, and effective periods"
        right={
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Add Policy
          </Button>
        }
      />

      {isLoading ? (
        <Loading />
      ) : policies.length === 0 ? (
        <Card withBorder p="xl" ta="center" radius="md">
          <IconShieldCheck size={40} color="#adb5bd" style={{ margin: '0 auto 12px' }} />
          <Text fw={500} mb={4}>
            No work policies yet
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Add a policy to configure break time and flexible windows.
          </Text>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={handleAdd}>
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
