import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  Tabs,
  Modal,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Loader,
  Center,
  ThemeIcon,
  ActionIcon,
  Tooltip,
  Avatar,
  Flex,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useParams } from 'react-router-dom';
import { IconTrophy, IconPlus, IconTrash, IconStar, IconCheck, IconEye } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { useConfirm } from '@/hooks/useConfirm';
import {
  useGetCycle,
  useGetReviewsByCycle,
  useGetAwardsByCycle,
  useCreateAward,
  useDeleteAward,
  usePublishReviews,
} from '../api';
import { AwardRevealPage } from '../components/AwardRevealPage';
import { notify } from '@/components/Notification';
import type { IAward } from '../types';
import { performanceCyclesUrl } from '@/routes/url';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const CATEGORY_LABEL: Record<string, string> = {
  top_employee: 'Top Employee',
  top_manager: 'Top Manager',
};
const STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};

export default function CycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cycle, isLoading: cycleLoading } = useGetCycle(id!);
  const { data: reviews = [], isLoading: reviewsLoading } = useGetReviewsByCycle(id!);
  const { data: awards = [] } = useGetAwardsByCycle(id!);
  const createAward = useCreateAward();
  const deleteAward = useDeleteAward();
  const publishReviews = usePublishReviews();
  const [awardModal, setAwardModal] = useState(false);
  const [previewAwards, setPreviewAwards] = useState<IAward[]>([]);

  const { confirm, ConfirmComponent } = useConfirm();

  const form = useForm({
    initialValues: {
      employee_id: '',
      category: 'top_employee' as 'top_employee' | 'top_manager',
      rank: 1,
      title: '',
      description: '',
    },
    validate: {
      employee_id: (v) => (!v ? 'Required' : null),
      title: (v) => (!v ? 'Required' : null),
    },
  });

  const handleCreateAward = async (values: typeof form.values) => {
    const nid = notify.loading('Creating award...');
    try {
      await createAward.mutateAsync({ ...values, cycle_id: id });
      notify.success(nid, { message: 'Award created' });
      setAwardModal(false);
      form.reset();
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to create award' });
    }
  };

  const handleDeleteAward = (id: string, employeeName: string, title: string) => {
    confirm({
      title: 'Delete Award',
      message: `Are you sure you want to delete the award "${title}" for ${employeeName}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading('Deleting award...');
        try {
          await deleteAward.mutateAsync(id);
          notify.success(notiId, { message: 'Award deleted successfully' });
        } catch (e: any) {
          notify.error(notiId, { message: e?.response?.data?.message || 'Failed to delete award' });
        }
      },
    });
  };

  const handlePublish = async () => {
    const nid = notify.loading('Publishing...');
    try {
      await publishReviews.mutateAsync(id!);
      notify.success(nid, { message: 'Reviews published' });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to publish' });
    }
  };

  const employeeOptions = reviews.map((r: any) => ({
    value: r.employee_id,
    label: r.employee?.full_name ?? r.employee_id,
  }));

  const submittedCount = reviews.filter((r: any) => r.status === 'submitted').length;

  const reviewColumns: TableColumn<any>[] = [
    {
      key: 'employee',
      title: 'Employee',
      render: (r) => (
        <Flex align="center" gap="sm">
          <Avatar size="sm" radius="xl" color="blue">
            {r.employee?.full_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Avatar>
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {r.employee?.full_name}
            </Text>
            <Text size="xs" c="dimmed">
              {r.employee?.position?.department?.department_name}
            </Text>
          </Stack>
        </Flex>
      ),
    },
    {
      key: 'reviewer',
      title: 'Reviewer',
      render: (r) => <Text size="sm">{r.reviewer?.full_name}</Text>,
    },
    {
      key: 'score',
      title: 'Score',
      align: 'center',
      sortable: true,
      sortAccessor: (r) => r.score ?? 0,
      render: (r) => (
        <Group gap={4} justify="center">
          <IconStar size={15} color="#FFD700" fill="#FFD700" />
          <Text fw={600} size="sm">
            {r.score}
          </Text>
        </Group>
      ),
    },
    {
      key: 'attendance',
      title: 'Attendance',
      render: (r) => (
        <Text size="xs" c="dimmed">
          {r.attendance_days}d · {r.late_count} late · {r.absent_count} absent
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (r) => (
        <Badge size="sm" color={STATUS_COLOR[r.status]} variant="light">
          {r.status}
        </Badge>
      ),
    },
  ];

  const awardColumns: TableColumn<any>[] = [
    {
      key: 'rank',
      title: 'Rank',
      align: 'center',
      render: (r) => (
        <ThemeIcon
          size="sm"
          radius="xl"
          variant="light"
          style={{ background: `${RANK_COLORS[r.rank - 1]}22` }}
        >
          <IconTrophy size={14} color={RANK_COLORS[r.rank - 1]} />
        </ThemeIcon>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      render: (r) => (
        <Badge size="sm" variant="light" color={r.category === 'top_manager' ? 'violet' : 'blue'}>
          {CATEGORY_LABEL[r.category]}
        </Badge>
      ),
    },
    {
      key: 'employee',
      title: 'Employee',
      render: (r) => (
        <Flex align="center" gap="sm">
          <Avatar size="sm" radius="xl" color="blue">
            {r.employee?.full_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Avatar>
          <Text size="sm" fw={500}>
            {r.employee?.full_name}
          </Text>
        </Flex>
      ),
    },
    {
      key: 'title',
      title: 'Title',
      render: (r) => <Text size="sm">{r.title}</Text>,
    },
    {
      key: 'actions',
      title: '',
      align: 'center',
      render: (r) => (
        <Group gap={4} justify="center">
          <Tooltip label="Preview Award Reveal">
            <ActionIcon
              variant="subtle"
              color="yellow"
              size="sm"
              onClick={() => setPreviewAwards([r])}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete award">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => handleDeleteAward(r.id, r.employee?.full_name, r.title)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  if (cycleLoading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  if (!cycle) return null;

  return (
    <Stack gap="lg">
      <PageHeader
        title={cycle.title}
        description={`Announce date: ${new Date(cycle.announce_date).toLocaleDateString('en-GB')}`}
        breadcrumbs={[
          { label: 'Review Cycles', path: performanceCyclesUrl },
          { label: cycle.title },
        ]}
        right={
          <Group>
            {awards.length > 0 && (
              <Button
                variant="light"
                color="yellow"
                leftSection={<IconEye size={18} />}
                onClick={() => setPreviewAwards(awards)}
              >
                Preview Reveal
              </Button>
            )}
            {submittedCount > 0 && (
              <Button
                variant="light"
                color="green"
                leftSection={<IconCheck size={18} />}
                onClick={handlePublish}
                loading={publishReviews.isPending}
              >
                Publish {submittedCount} reviews
              </Button>
            )}
            <Button leftSection={<IconPlus size={18} />} onClick={() => setAwardModal(true)}>
              Add Award
            </Button>
          </Group>
        }
      />

      <Tabs defaultValue="reviews" variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="reviews" leftSection={<IconStar size={16} />}>
            Reviews ({reviews.length})
          </Tabs.Tab>
          <Tabs.Tab value="awards" leftSection={<IconTrophy size={16} />}>
            Awards ({awards.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reviews">
          <BaseTable
            data={reviews}
            columns={reviewColumns}
            loading={reviewsLoading}
            height={480}
            highlightOnHover
            emptyText="No reviews yet"
          />
        </Tabs.Panel>

        <Tabs.Panel value="awards">
          <BaseTable
            data={awards}
            columns={awardColumns}
            height={480}
            highlightOnHover
            emptyText="No awards yet"
          />
        </Tabs.Panel>
      </Tabs>

      {previewAwards.length > 0 && (
        <AwardRevealPage awards={previewAwards} onClose={() => setPreviewAwards([])} previewMode />
      )}

      <Modal opened={awardModal} onClose={() => setAwardModal(false)} title="Add Award" centered>
        <form onSubmit={form.onSubmit(handleCreateAward)}>
          <Stack gap="sm">
            <Select
              label="Employee"
              placeholder="Select employee"
              data={employeeOptions}
              searchable
              required
              checkIconPosition="right"
              {...form.getInputProps('employee_id')}
            />
            <Select
              label="Category"
              data={[
                { value: 'top_employee', label: 'Top Employee' },
                { value: 'top_manager', label: 'Top Manager' },
              ]}
              checkIconPosition="right"
              {...form.getInputProps('category')}
            />
            <NumberInput label="Rank" min={1} max={3} {...form.getInputProps('rank')} />
            <TextInput label="Award Title" required {...form.getInputProps('title')} />
            <Textarea
              label="Achievement Description"
              rows={3}
              {...form.getInputProps('description')}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" onClick={() => setAwardModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createAward.isPending}>
                Create Award
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmComponent />
    </Stack>
  );
}
