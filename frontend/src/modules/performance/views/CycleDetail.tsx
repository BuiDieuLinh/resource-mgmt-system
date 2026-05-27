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
  Progress,
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
import type { IAward, IPerformanceReview } from '../types';
import { performanceCyclesUrl } from '@/routes/url';
import { useTranslation } from 'react-i18next';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};

function formatReviewScore(review: IPerformanceReview) {
  const details = review.score_details;
  if (details && details.length > 0) {
    const scaleMax = details[0]?.max_score ?? 5;
    const avg =
      details.reduce((sum, sd) => sum + (sd.score / sd.max_score) * scaleMax, 0) / details.length;
    return `${Math.round(avg * 10) / 10}/${scaleMax}`;
  }

  if (review.total_score == null) return '—';

  const normalized = Math.round((review.total_score / 20) * 10) / 10;
  return `${normalized}/5`;
}

function normalizeReviewScore(review: IPerformanceReview) {
  const details = review.score_details;
  if (details && details.length > 0) {
    const scaleMax = details[0]?.max_score ?? 5;
    return (
      details.reduce((sum, sd) => sum + (sd.score / sd.max_score) * scaleMax, 0) / details.length
    );
  }

  if (review.total_score == null) return 0;
  return review.total_score / 20;
}

export default function CycleDetailPage() {
  const { t } = useTranslation();
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
      employee_id: (v) => (!v ? t('common.required') : null),
      title: (v) => (!v ? t('common.required') : null),
    },
  });

  const handleCreateAward = async (values: typeof form.values) => {
    const nid = notify.loading(t('performance.creatingAward'));
    try {
      await createAward.mutateAsync({ ...values, cycle_id: id });
      notify.success(nid, { message: t('performance.awardCreated') });
      setAwardModal(false);
      form.reset();
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('performance.awardCreateFailed'),
      });
    }
  };

  const handleDeleteAward = (id: string, employeeName: string, title: string) => {
    confirm({
      title: t('performance.deleteAwardTitle'),
      message: t('performance.deleteAwardMessage', { title, employeeName }),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('common.cancel'),
      type: 'delete',
      onConfirm: async () => {
        const notiId = notify.loading(t('performance.deletingAward'));
        try {
          await deleteAward.mutateAsync(id);
          notify.success(notiId, { message: t('performance.awardDeleted') });
        } catch (e: any) {
          notify.error(notiId, {
            message: e?.response?.data?.message || t('performance.awardDeleteFailed'),
          });
        }
      },
    });
  };

  const handlePublish = async () => {
    const nid = notify.loading(t('performance.publishingReviews'));
    try {
      await publishReviews.mutateAsync(id!);
      notify.success(nid, { message: t('performance.reviewsPublished') });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || t('performance.publishFailed') });
    }
  };

  const employeeOptions = reviews.map((r: IPerformanceReview) => ({
    value: r.employee_id,
    label: r.employee?.full_name ?? r.employee_id,
  }));

  const submittedCount = reviews.filter((r: IPerformanceReview) => r.status === 'submitted').length;
  const completedCount = reviews.filter((r: IPerformanceReview) =>
    ['submitted', 'published'].includes(r.status),
  ).length;
  const totalReviews = reviews.length;
  const completionRate = totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0;

  const reviewColumns: TableColumn<IPerformanceReview>[] = [
    {
      key: 'employee',
      title: t('employee.employee'),
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
      title: t('performance.reviewer'),
      render: (r) => (
        <Text size="sm">{r.assignment?.reviewer?.full_name ?? t('performance.unassigned')}</Text>
      ),
    },
    {
      key: 'score',
      title: t('performance.score'),
      align: 'center',
      sortable: true,
      sortAccessor: (r) => normalizeReviewScore(r),
      render: (r) => (
        <Group gap={4} justify="center">
          <IconStar size={15} color="#FFD700" fill="#FFD700" />
          <Text fw={600} size="sm">
            {formatReviewScore(r)}
          </Text>
        </Group>
      ),
    },
    {
      key: 'attendance',
      title: t('nav.attendance'),
      render: (r) => (
        <Text size="xs" c="dimmed">
          {t('performance.attendanceSummary', {
            days: r.attendance_days,
            late: r.late_count,
            absent: r.absent_count,
          })}
        </Text>
      ),
    },
    {
      key: 'status',
      title: t('common.status'),
      align: 'center',
      render: (r) => (
        <Badge size="sm" color={STATUS_COLOR[r.status]} variant="light">
          {t(`labels.leaveStatus.${r.status}` as const, { defaultValue: r.status })}
        </Badge>
      ),
    },
  ];

  const awardColumns: TableColumn<any>[] = [
    {
      key: 'rank',
      title: t('performance.rank'),
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
      title: t('common.category'),
      render: (r) => (
        <Badge size="sm" variant="light" color={r.category === 'top_manager' ? 'violet' : 'blue'}>
          {t(`labels.awardCategory.${r.category}` as const)}
        </Badge>
      ),
    },
    {
      key: 'employee',
      title: t('employee.employee'),
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
      title: t('common.title'),
      render: (r) => <Text size="sm">{r.title}</Text>,
    },
    {
      key: 'actions',
      title: '',
      align: 'center',
      render: (r) => (
        <Group gap={4} justify="center">
          <Tooltip label={t('performance.previewAwardReveal')}>
            <ActionIcon
              variant="subtle"
              color="yellow"
              size="sm"
              onClick={() => setPreviewAwards([r])}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('performance.deleteAward')}>
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
        description={t('performance.announceDateValue', {
          date: new Date(cycle.announce_date).toLocaleDateString('en-GB'),
        })}
        breadcrumbs={[
          { label: t('nav.reviewCycles'), path: performanceCyclesUrl },
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
                {t('performance.previewReveal')}
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
                {t('performance.publishReviewsCount', { count: submittedCount })}
              </Button>
            )}
            <Button leftSection={<IconPlus size={18} />} onClick={() => setAwardModal(true)}>
              {t('performance.addAward')}
            </Button>
          </Group>
        }
      />

      <Stack gap={8}>
        <Group justify="space-between" gap="xs">
          <Text size="sm" fw={500}>
            {t('performance.reviewCompletion')}
          </Text>
          <Text size="sm" fw={600}>
            {t('performance.reviewCompletionValue', {
              completed: completedCount,
              total: totalReviews,
              percent: completionRate,
            })}
          </Text>
        </Group>
        <Progress value={completionRate} color={completionRate === 100 ? 'green' : 'blue'} />
      </Stack>

      <Tabs defaultValue="reviews" variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="reviews" leftSection={<IconStar size={16} />}>
            {t('performance.reviewsTab', { count: reviews.length })}
          </Tabs.Tab>
          <Tabs.Tab value="awards" leftSection={<IconTrophy size={16} />}>
            {t('performance.awardsTab', { count: awards.length })}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reviews">
          <BaseTable
            data={reviews}
            columns={reviewColumns}
            loading={reviewsLoading}
            height={480}
            highlightOnHover
            emptyText={t('performance.noReviewsYet')}
          />
        </Tabs.Panel>

        <Tabs.Panel value="awards">
          <BaseTable
            data={awards}
            columns={awardColumns}
            height={480}
            highlightOnHover
            emptyText={t('performance.noAwardsYet')}
          />
        </Tabs.Panel>
      </Tabs>

      {previewAwards.length > 0 && (
        <AwardRevealPage awards={previewAwards} onClose={() => setPreviewAwards([])} previewMode />
      )}

      <Modal
        opened={awardModal}
        onClose={() => setAwardModal(false)}
        title={t('performance.addAward')}
        centered
      >
        <form onSubmit={form.onSubmit(handleCreateAward)}>
          <Stack gap="sm">
            <Select
              label={t('employee.employee')}
              placeholder={t('performance.selectEmployee')}
              data={employeeOptions}
              searchable
              required
              checkIconPosition="right"
              {...form.getInputProps('employee_id')}
            />
            <Select
              label={t('common.category')}
              data={[
                { value: 'top_employee', label: t('labels.awardCategory.top_employee') },
                { value: 'top_manager', label: t('labels.awardCategory.top_manager') },
              ]}
              checkIconPosition="right"
              {...form.getInputProps('category')}
            />
            <NumberInput
              label={t('performance.rank')}
              min={1}
              max={3}
              {...form.getInputProps('rank')}
            />
            <TextInput
              label={t('performance.awardTitle')}
              required
              {...form.getInputProps('title')}
            />
            <Textarea
              label={t('performance.achievementDescription')}
              rows={3}
              {...form.getInputProps('description')}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" onClick={() => setAwardModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={createAward.isPending}>
                {t('performance.createAward')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmComponent />
    </Stack>
  );
}
