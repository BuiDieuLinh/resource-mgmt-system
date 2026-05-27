import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  Select,
  Loader,
  Center,
  Tooltip,
  ActionIcon,
  Progress,
} from '@mantine/core';
import { IconPlus, IconTrophy, IconCalendar, IconEdit } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { useGetCycles, useCreateCycle, useGetTemplates, useUpdateCycle } from '../api';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { CreateCycleModal } from '../components/CreateCycleModal';
import { notify } from '@/components/Notification';
import { performanceCycleDetailUrl } from '@/routes/url';
import type { IReviewCycle } from '../types';
import { useTranslation } from 'react-i18next';

const PERIOD_COLOR: Record<string, string> = { monthly: 'blue', quarterly: 'violet' };
type CycleReviewSummary = NonNullable<IReviewCycle['reviews']>[number];

const isReviewStarted = (review?: CycleReviewSummary) =>
  Boolean(
    review &&
    (review.status !== 'draft' ||
      review.total_score !== undefined ||
      Boolean(review.comment?.trim()) ||
      Boolean(review.achievements?.trim()) ||
      (review.score_details?.length ?? 0) > 0),
  );

export default function PerformanceCyclesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: cycles = [], isLoading } = useGetCycles();
  const { data: templates = [] } = useGetTemplates();
  const { data: employeesRes } = useGetEmployees({ pageIndex: 1 });
  const employees = employeesRes?.data ?? [];

  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const [opened, setOpened] = useState(false);
  const [editingCycle, setEditingCycle] = useState<IReviewCycle | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string | null>(null);

  const handleCreateCycle = async (values: any) => {
    const nid = notify.loading(t('performance.creatingCycle'));
    try {
      await createCycle.mutateAsync(values);
      notify.success(nid, { message: t('performance.cycleCreated') });
      setOpened(false);
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('performance.cycleCreateFailed'),
      });
      throw e;
    }
  };

  const handleUpdateCycle = async (values: any) => {
    if (!editingCycle) return;

    const nid = notify.loading(t('settings.workPolicies.updating'));
    try {
      await updateCycle.mutateAsync({ id: editingCycle.id, ...values });
      notify.success(nid, { message: t('performance.cycleUpdated') });
      setOpened(false);
      setEditingCycle(null);
    } catch (e: any) {
      notify.error(nid, {
        message: e?.response?.data?.message || t('performance.cycleUpdateFailed'),
      });
      throw e;
    }
  };

  const handleOpenCreate = () => {
    setEditingCycle(null);
    setOpened(true);
  };

  const handleOpenEdit = (cycle: IReviewCycle) => {
    setEditingCycle(cycle);
    setOpened(true);
  };

  const filteredCycles = useMemo(() => {
    let result = cycles;
    if (filterType) {
      result = result.filter((c) => c.period_type === filterType);
    }
    if (filterYear) {
      result = result.filter((c) => c.period_year.toString() === filterYear);
    }
    return result;
  }, [cycles, filterType, filterYear]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(cycles.map((c) => c.period_year))];
    return uniqueYears
      .sort((a, b) => b - a)
      .map((y) => ({ value: y.toString(), label: y.toString() }));
  }, [cycles]);

  const columns: TableColumn<IReviewCycle>[] = [
    {
      key: 'title',
      title: t('performance.cycleName'),
      sortable: true,
      render: (r) => (
        <div>
          <Text
            fw={500}
            style={{ cursor: 'pointer' }}
            size="sm"
            onClick={() => navigate(performanceCycleDetailUrl.replace(':id', r.id))}
          >
            {r.title}
          </Text>
          <Text size="xs" c="dimmed">
            {r.period_year} · {t('performance.periodSequence', { seq: r.period_seq })}
          </Text>
        </div>
      ),
    },
    {
      key: 'period_type',
      title: t('common.type'),
      render: (r) => (
        <Badge variant="light" color={PERIOD_COLOR[r.period_type]} size="sm" fw={500}>
          {r.period_type === 'monthly'
            ? t('performance.periodMonthly')
            : t('performance.periodQuarterly')}
        </Badge>
      ),
    },
    {
      key: 'template',
      title: t('common.template'),
      render: (r) =>
        r.template ? (
          <Tooltip label={r.template.description || r.template.title}>
            <Badge variant="light" color="cyan" size="sm" fw={500}>
              {r.template.title}
            </Badge>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            {t('performance.noTemplate')}
          </Text>
        ),
    },
    {
      key: 'announce_date',
      title: t('performance.announceDate'),
      sortable: true,
      render: (r) => {
        const isOver = new Date(r.announce_date) > new Date();
        return (
          <Group gap={6}>
            <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c={isOver ? 'blue' : 'dimmed'}>
              {new Date(r.announce_date).toLocaleDateString('en-GB')}
            </Text>
          </Group>
        );
      },
    },
    {
      key: 'stats',
      title: t('common.progress'),
      align: 'center',
      render: (r) => {
        const totalAssignments = r._count?.assignments ?? r.assignments?.length ?? 0;
        const completedReviews = r.reviews?.filter((review) => isReviewStarted(review)).length ?? 0;
        const completionRate =
          totalAssignments > 0 ? Math.round((completedReviews / totalAssignments) * 100) : 0;

        return (
          <Stack gap={6} style={{ minWidth: 180 }}>
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                {t('performance.completedCount', {
                  completed: completedReviews,
                  total: totalAssignments,
                })}
              </Text>
              <Text size="xs" fw={600}>
                {completionRate}%
              </Text>
            </Group>
            <Progress value={completionRate} color={completionRate === 100 ? 'green' : 'blue'} />
            {(r._count?.awards ?? 0) > 0 && (
              <Badge
                variant="light"
                color="yellow"
                size="sm"
                fw={500}
                style={{ alignSelf: 'flex-start' }}
              >
                <Group gap={4}>
                  <IconTrophy size={14} />
                  {r._count?.awards}
                </Group>
              </Badge>
            )}
          </Stack>
        );
      },
    },
    {
      key: 'actions',
      title: t('actions.actions'),
      align: 'center',
      width: 60,
      render: (r) => {
        const isOver = new Date(r.announce_date) < new Date();
        return (
          <Tooltip label={t('performance.editCycle')}>
            <ActionIcon
              variant="subtle"
              color="blue"
              disabled={isOver}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(r);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title={t('pages.performanceCyclesTitle')}
        description={t('pages.performanceCyclesDescription')}
        right={
          <Group>
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate}>
              {t('performance.newCycle')}
            </Button>
            <Group>
              <Select
                placeholder={t('performance.filterByType')}
                data={[
                  { value: 'monthly', label: t('performance.periodMonthly') },
                  { value: 'quarterly', label: t('performance.periodQuarterly') },
                ]}
                value={filterType}
                onChange={setFilterType}
                clearable
                checkIconPosition="right"
                style={{ width: 180 }}
              />
              <Select
                placeholder={t('performance.filterByYear')}
                data={years}
                value={filterYear}
                onChange={setFilterYear}
                clearable
                checkIconPosition="right"
                style={{ width: 150 }}
              />
              {(filterType || filterYear) && (
                <Text size="sm" c="dimmed">
                  {t('performance.showingCycles', {
                    filtered: filteredCycles.length,
                    total: cycles.length,
                  })}
                </Text>
              )}
            </Group>
          </Group>
        }
      />

      <BaseTable
        data={filteredCycles}
        columns={columns}
        height={520}
        highlightOnHover
        emptyText={t('performance.noCyclesFound')}
      />

      <CreateCycleModal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditingCycle(null);
        }}
        onSubmit={editingCycle ? handleUpdateCycle : handleCreateCycle}
        templates={templates}
        employees={employees}
        isLoading={createCycle.isPending || updateCycle.isPending}
        mode={editingCycle ? 'update' : 'create'}
        initialValues={editingCycle}
      />
    </Stack>
  );
}
