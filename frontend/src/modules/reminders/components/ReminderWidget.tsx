import { useState } from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Box,
  Tabs,
  Button,
  ThemeIcon,
  Skeleton,
  Anchor,
} from '@mantine/core';
import {
  IconBell,
  IconAlertTriangle,
  IconCalendarClock,
  IconUserCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardReminders, type DashboardReminder } from '../api';
import { performanceReviewUrl, performanceCyclesUrl } from '@/routes/url';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  DashboardReminder['type'],
  { label: string; color: string; icon: React.ReactNode; tab: string }
> = {
  contract_ending: {
    label: 'Sắp kết thúc',
    color: 'yellow',
    icon: <IconAlertTriangle size={14} />,
    tab: 'contract',
  },
  cycle_deadline: {
    label: 'Deadline chu kỳ',
    color: 'blue',
    icon: <IconCalendarClock size={14} />,
    tab: 'cycle',
  },
  cycle_unreviewed: {
    label: 'Chưa đánh giá',
    color: 'orange',
    icon: <IconUserCheck size={14} />,
    tab: 'cycle',
  },
};

const CONTRACT_LABEL: Record<string, string> = {
  intern: 'Thực tập',
  probation: 'Thử việc',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ReminderRow({ item }: { item: DashboardReminder }) {
  const navigate = useNavigate();
  const meta = TYPE_META[item.type];
  const isOverdue = item.days_remaining !== null && item.days_remaining < 0;
  const isCycle = item.type === 'cycle_deadline' || item.type === 'cycle_unreviewed';

  const daysLabel = (() => {
    if (item.days_remaining === null) return null;
    if (item.days_remaining < 0) return `Quá hạn ${Math.abs(item.days_remaining)} ngày`;
    if (item.days_remaining === 0) return 'Hôm nay';
    return `Còn ${item.days_remaining} ngày`;
  })();

  const handleAction = () => {
    if (isCycle) navigate(performanceCyclesUrl);
    else navigate(performanceReviewUrl);
  };

  return (
    <Group
      justify="space-between"
      align="center"
      py="xs"
      px="sm"
      wrap="nowrap"
      style={{
        borderRadius: 6,
        background: isOverdue ? 'var(--mantine-color-red-0)' : 'transparent',
      }}
    >
      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <ThemeIcon
          size="sm"
          variant="light"
          color={meta.color}
          radius="xl"
          style={{ flexShrink: 0 }}
        >
          {meta.icon}
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          {isCycle ? (
            <Text size="xs" fw={500} lineClamp={1}>
              {item.cycle_title}
            </Text>
          ) : (
            <Text size="xs" fw={500} lineClamp={1}>
              {item.employee_name}
            </Text>
          )}
          <Group gap={4} mt={1}>
            <Badge size="xs" variant="light" color={meta.color}>
              {meta.label}
            </Badge>
            {!isCycle && item.contract_type && (
              <Badge size="xs" variant="outline" color="gray">
                {CONTRACT_LABEL[item.contract_type] ?? item.contract_type}
              </Badge>
            )}
          </Group>
        </Box>
      </Group>

      <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
        {daysLabel && (
          <Text size="xs" c={isOverdue ? 'red' : 'dimmed'} fw={isOverdue ? 600 : 400}>
            {daysLabel}
          </Text>
        )}
        <Button
          size="xs"
          variant="subtle"
          color={meta.color}
          rightSection={<IconArrowRight size={12} />}
          onClick={handleAction}
          px={6}
        >
          Xử lý
        </Button>
      </Group>
    </Group>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function ReminderWidget() {
  const { data: reminders = [], isLoading } = useGetDashboardReminders();
  const [tab, setTab] = useState<string>('all');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Stack gap="xs">
        <Skeleton h={20} w={160} />
        <Skeleton h={48} />
        <Skeleton h={48} />
        <Skeleton h={48} />
      </Stack>
    );
  }

  if (reminders.length === 0) return null;

  const contractItems = reminders.filter((r) => r.type === 'contract_ending');
  const cycleItems = reminders.filter(
    (r) => r.type === 'cycle_deadline' || r.type === 'cycle_unreviewed',
  );

  const displayed = tab === 'contract' ? contractItems : tab === 'cycle' ? cycleItems : reminders;

  const overdueCount = reminders.filter(
    (r) => r.days_remaining !== null && r.days_remaining < 0,
  ).length;

  return (
    <Stack gap="sm">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="orange" radius="sm">
            <IconBell size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            Nhắc nhở đánh giá
          </Text>
          <Badge size="xs" color="orange" variant="filled">
            {reminders.length}
          </Badge>
          {overdueCount > 0 && (
            <Badge size="xs" color="red" variant="filled">
              {overdueCount} quá hạn
            </Badge>
          )}
        </Group>
        <Anchor
          size="xs"
          c="dimmed"
          onClick={() => navigate(performanceReviewUrl)}
          style={{ cursor: 'pointer' }}
        >
          Xem tất cả
        </Anchor>
      </Group>

      {/* Tabs */}
      <Tabs value={tab} onChange={(v) => setTab(v ?? 'all')} variant="pills">
        <Tabs.List>
          <Tabs.Tab value="all" fz="xs">
            Tất cả ({reminders.length})
          </Tabs.Tab>
          {contractItems.length > 0 && (
            <Tabs.Tab value="contract" fz="xs">
              Intern / Thử việc ({contractItems.length})
            </Tabs.Tab>
          )}
          {cycleItems.length > 0 && (
            <Tabs.Tab value="cycle" fz="xs">
              Chu kỳ ({cycleItems.length})
            </Tabs.Tab>
          )}
        </Tabs.List>
      </Tabs>

      {/* List — max 5 items */}
      <Stack gap={4}>
        {displayed.slice(0, 5).map((item, i) => (
          <ReminderRow key={`${item.type}-${item.employee_id}-${item.cycle_id}-${i}`} item={item} />
        ))}
        {displayed.length > 5 && (
          <Text size="xs" c="dimmed" ta="center" pt={4}>
            +{displayed.length - 5} nhắc nhở khác
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
