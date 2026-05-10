import { useState, useMemo } from 'react';
import { Stack, Group, Button, Badge, Text, Select, Loader, Center, Tooltip } from '@mantine/core';
import { IconPlus, IconTrophy, IconCalendar } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { useGetCycles, useCreateCycle, useGetTemplates } from '../api';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { CreateCycleModal } from '../components/CreateCycleModal';
import { notify } from '@/components/Notification';
import { performanceCycleDetailUrl } from '@/routes/url';
import type { IReviewCycle } from '../types';

const PERIOD_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly' };
const PERIOD_COLOR: Record<string, string> = { monthly: 'blue', quarterly: 'violet' };

export default function PerformanceCyclesPage() {
  const navigate = useNavigate();
  const { data: cycles = [], isLoading } = useGetCycles();
  const { data: templates = [] } = useGetTemplates();
  const { data: employeesRes } = useGetEmployees({ pageSize: 500 });
  const employees = employeesRes?.data ?? [];

  const createCycle = useCreateCycle();
  const [opened, setOpened] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<string | null>(null);

  const handleCreateCycle = async (values: any) => {
    const nid = notify.loading('Creating cycle...');
    try {
      await createCycle.mutateAsync(values);
      notify.success(nid, { message: 'Review cycle created successfully' });
      setOpened(false);
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'Failed to create cycle' });
      throw e;
    }
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
      title: 'Cycle Name',
      sortable: true,
      render: (r) => (
        <div>
          <Text fw={500} size="sm">
            {r.title}
          </Text>
          <Text size="xs" c="dimmed">
            {r.period_year} · Period {r.period_seq}
          </Text>
        </div>
      ),
    },
    {
      key: 'period_type',
      title: 'Type',
      render: (r) => (
        <Badge variant="light" color={PERIOD_COLOR[r.period_type]} size="sm" fw={500}>
          {PERIOD_LABEL[r.period_type]}
        </Badge>
      ),
    },
    {
      key: 'template',
      title: 'Template',
      render: (r) =>
        r.template ? (
          <Tooltip label={r.template.description || r.template.title}>
            <Badge variant="light" color="cyan" size="sm" fw={500}>
              {r.template.title}
            </Badge>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            No template
          </Text>
        ),
    },
    {
      key: 'announce_date',
      title: 'Announce Date',
      sortable: true,
      render: (r) => {
        const d = new Date(r.announce_date);
        const isPast = d < new Date();
        return (
          <Group gap={6}>
            <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c={isPast ? 'dimmed' : 'blue'}>
              {d.toLocaleDateString('en-GB')}
            </Text>
          </Group>
        );
      },
    },
    {
      key: 'stats',
      title: 'Progress',
      align: 'center',
      render: (r) => (
        <Group gap="xs" justify="center">
          <Badge variant="light" size="sm" fw={500}>
            {r._count?.reviews ?? 0} reviews
          </Badge>
          {(r._count?.awards ?? 0) > 0 && (
            <Badge variant="light" color="yellow" size="sm" fw={500}>
              <Group gap={4}>
                <IconTrophy size={14} />
                {r._count?.awards}
              </Group>
            </Badge>
          )}
        </Group>
      ),
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
        title="Review Cycles"
        description="Manage performance review cycles and track evaluation progress"
        right={
          <Group>
            <Button leftSection={<IconPlus size={18} />} onClick={() => setOpened(true)}>
              New Cycle
            </Button>
            <Group>
              <Select
                placeholder="Filter by type"
                data={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                ]}
                value={filterType}
                onChange={setFilterType}
                clearable
                checkIconPosition="right"
                style={{ width: 180 }}
              />
              <Select
                placeholder="Filter by year"
                data={years}
                value={filterYear}
                onChange={setFilterYear}
                clearable
                checkIconPosition="right"
                style={{ width: 150 }}
              />
              {(filterType || filterYear) && (
                <Text size="sm" c="dimmed">
                  Showing {filteredCycles.length} of {cycles.length} cycles
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
        onRowClick={(r) => navigate(performanceCycleDetailUrl.replace(':id', r.id))}
        emptyText="No review cycles found. Create your first cycle to get started."
      />

      <CreateCycleModal
        opened={opened}
        onClose={() => setOpened(false)}
        onSubmit={handleCreateCycle}
        templates={templates}
        employees={employees}
        isLoading={createCycle.isPending}
      />
    </Stack>
  );
}
