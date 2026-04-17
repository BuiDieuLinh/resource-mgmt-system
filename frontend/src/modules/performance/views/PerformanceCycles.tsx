import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Badge,
  Text,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { IconPlus, IconTrophy, IconChevronRight, IconEye } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { useGetCycles, useCreateCycle, useGetAwardsByCycle } from '../api';
import { AwardRevealPage } from '../components/AwardRevealPage';
import { notify } from '@/components/Notification';
import { performanceCycleDetailUrl } from '@/routes/url';
import type { IReviewCycle, IAward } from '../types';

const PERIOD_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly' };

export default function PerformanceCyclesPage() {
  const navigate = useNavigate();
  const { data: cycles = [], isLoading } = useGetCycles();
  const createCycle = useCreateCycle();
  const [opened, setOpened] = useState(false);
  const [previewCycleId, setPreviewCycleId] = useState<string | null>(null);
  const [previewAwards, setPreviewAwards] = useState<IAward[]>([]);

  const { data: awardsForPreview = [] } = useGetAwardsByCycle(previewCycleId ?? '');

  const form = useForm({
    initialValues: {
      title: '',
      period_type: 'monthly' as 'monthly' | 'quarterly',
      period_year: new Date().getFullYear(),
      period_seq: new Date().getMonth() + 1,
      announce_date: null as Date | null,
    },
    validate: {
      title: (v) => (!v ? 'Required' : null),
      announce_date: (v) => (!v ? 'Required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const nid = notify.loading('Creating...');
    try {
      await createCycle.mutateAsync({
        ...values,
        announce_date:
          values.announce_date instanceof Date
            ? values.announce_date.toISOString().slice(0, 10)
            : new Date(values.announce_date!).toISOString().slice(0, 10),
      });
      notify.success(nid, { message: 'Review cycle created' });
      setOpened(false);
      form.reset();
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to create cycle' });
    }
  };

  const handleShowPreview = () => {
    if (awardsForPreview.length > 0) setPreviewAwards(awardsForPreview);
    else notify.error('', { message: 'No awards in this cycle yet' });
  };

  const columns: TableColumn<IReviewCycle>[] = [
    {
      key: 'title',
      title: 'Cycle Name',
      sortable: true,
      render: (r) => <Text fw={500}>{r.title}</Text>,
    },
    {
      key: 'period_type',
      title: 'Type',
      render: (r) => (
        <Badge variant="light" size="sm">
          {PERIOD_LABEL[r.period_type]}
        </Badge>
      ),
    },
    {
      key: 'period_year',
      title: 'Year',
      align: 'center',
      sortable: true,
    },
    {
      key: 'period_seq',
      title: 'Period',
      align: 'center',
    },
    {
      key: 'announce_date',
      title: 'Announce Date',
      sortable: true,
      render: (r) => {
        const d = new Date(r.announce_date);
        const isPast = d < new Date();
        return (
          <Badge variant="light" color={isPast ? 'gray' : 'blue'} size="sm">
            {d.toLocaleDateString('en-GB')}
          </Badge>
        );
      },
    },
    {
      key: 'reviews',
      title: 'Reviews',
      align: 'center',
      render: (r) => <Text size="sm">{r._count?.reviews ?? 0}</Text>,
    },
    {
      key: 'awards',
      title: 'Awards',
      align: 'center',
      render: (r) => (
        <Group gap={4} justify="center">
          <IconTrophy size={14} color="#FFD700" />
          <Text size="sm">{r._count?.awards ?? 0}</Text>
        </Group>
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'center',
      render: (r) => (
        <Group gap={4} justify="center">
          {(r._count?.awards ?? 0) > 0 && (
            <Button
              size="xs"
              variant="subtle"
              color="yellow"
              leftSection={<IconEye size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewCycleId(r.id);
              }}
            >
              Preview
            </Button>
          )}
          <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="lg">
      <PageHeader
        title="Review Cycles"
        description="Manage performance review cycles and awards"
        right={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setOpened(true)}>
            New Cycle
          </Button>
        }
      />

      {isLoading ? (
        <Center h={300}>
          <Loader />
        </Center>
      ) : (
        <BaseTable
          data={cycles}
          columns={columns}
          height={520}
          highlightOnHover
          onRowClick={(r) => navigate(performanceCycleDetailUrl.replace(':id', r.id))}
        />
      )}

      {previewCycleId && awardsForPreview.length > 0 && (
        <Group justify="center" mt="sm">
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'blue' }}
            leftSection={<IconTrophy size={16} />}
            onClick={handleShowPreview}
          >
            Preview Award Reveal
          </Button>
        </Group>
      )}

      {previewAwards.length > 0 && (
        <AwardRevealPage
          awards={previewAwards}
          onClose={() => {
            setPreviewAwards([]);
            setPreviewCycleId(null);
          }}
          previewMode
        />
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="New Review Cycle" centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Cycle Name"
              placeholder="e.g. Q1 2026"
              required
              {...form.getInputProps('title')}
            />
            <Select
              label="Type"
              data={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
              ]}
              {...form.getInputProps('period_type')}
            />
            <Group grow>
              <NumberInput
                label="Year"
                min={2020}
                max={2100}
                {...form.getInputProps('period_year')}
              />
              <NumberInput
                label={form.values.period_type === 'monthly' ? 'Month (1-12)' : 'Quarter (1-4)'}
                min={1}
                max={form.values.period_type === 'monthly' ? 12 : 4}
                {...form.getInputProps('period_seq')}
              />
            </Group>
            <DateInput
              label="Announce Date"
              placeholder="Pick a date"
              required
              {...form.getInputProps('announce_date')}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="subtle" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createCycle.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
