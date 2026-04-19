import { useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Title,
  RingProgress,
  Skeleton,
  Select,
  Divider,
  SimpleGrid,
  Paper,
  useMantineColorScheme,
  SegmentedControl,
  Progress,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import {
  IconUsers,
  IconCalendarCheck,
  IconCalendarOff,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconRefresh,
  IconBuilding,
  IconUserPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useGetAnalyticsOverview } from '../api/get-analytics';
import { useGetMyAttendance } from '@/modules/attendances/api/get-my-attendance';
import { useGetLeaveRequests } from '@/modules/leave-requests/api/get-leave-requests';
import { EMPLOYEE_ROLE } from '@/constant';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const LEVEL_COLORS: Record<string, string> = {
  junior: '#74c0fc',
  mid: '#339af0',
  senior: '#1971c2',
  lead: '#f59f00',
  manager: '#7950f2',
};

const LEAVE_COLORS: Record<string, string> = {
  annual: '#339af0',
  sick: '#f03e3e',
  maternity: '#f59f00',
  paternity: '#12b886',
  unpaid: '#868e96',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function delta(current: number, prev: number) {
  if (prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return pct;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  if (value > 0)
    return (
      <Badge size="xs" color="teal" leftSection={<IconTrendingUp size={10} />}>
        {value}%
      </Badge>
    );
  if (value < 0)
    return (
      <Badge size="xs" color="red" leftSection={<IconTrendingDown size={10} />}>
        {Math.abs(value)}%
      </Badge>
    );
  return (
    <Badge size="xs" color="gray" leftSection={<IconMinus size={10} />}>
      0%
    </Badge>
  );
}

function KpiCard({
  icon,
  color,
  label,
  value,
  sub,
  delta: d,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
}) {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" wrap="nowrap" mb={8}>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          {label}
        </Text>
        <ThemeIcon size={32} radius="md" color={color} variant={dark ? 'light' : 'light'}>
          {icon}
        </ThemeIcon>
      </Group>
      <Text fw={800} size="xl" lh={1.1}>
        {value}
      </Text>
      <Group gap={6} mt={4}>
        {sub && (
          <Text size="xs" c="dimmed">
            {sub}
          </Text>
        )}
        {d !== undefined && <DeltaBadge value={d} />}
      </Group>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fw={700} size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }} mb={4}>
      {children}
    </Text>
  );
}

// ─── ADMIN dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const gridColor = dark ? '#373A40' : '#e9ecef';
  const textColor = dark ? '#909296' : '#868e96';
  const tooltipStyle = {
    background: dark ? '#25262b' : '#fff',
    border: `1px solid ${gridColor}`,
    borderRadius: 8,
    fontSize: 12,
  };

  const [year, setYear] = useState(CURRENT_YEAR);
  const [view, setView] = useState<'month' | 'quarter'>('month');

  const { data, isLoading: _loading, refetch } = useGetAnalyticsOverview(year);
  const isLoading = useDelayedLoading(_loading);

  const yearOptions = Array.from({ length: 4 }, (_, i) => ({
    value: String(CURRENT_YEAR - i),
    label: String(CURRENT_YEAR - i),
  }));

  const summary = data?.summary;
  const headcount = data?.headcount_by_month ?? [];
  const attendance = data?.attendance_by_month ?? [];
  const leaves = data?.leave_by_month ?? [];
  const depts = data?.department_breakdown ?? [];
  const quarterly = data?.quarterly_summary ?? [];

  // compare current month vs prev month
  const curMonthIdx = CURRENT_MONTH - 1;
  const prevMonthIdx = curMonthIdx > 0 ? curMonthIdx - 1 : 0;
  const curAtt = attendance[curMonthIdx];
  const prevAtt = attendance[prevMonthIdx];

  const attRateDelta =
    curAtt && prevAtt ? delta(curAtt.attendance_rate, prevAtt.attendance_rate) : null;
  const lateRateDelta = curAtt && prevAtt ? delta(curAtt.late_rate, prevAtt.late_rate) : null;

  // headcount growth
  const curHead = headcount[curMonthIdx]?.headcount ?? 0;
  const prevHead = headcount[prevMonthIdx]?.headcount ?? 0;
  const headDelta = delta(curHead, prevHead);

  // chart data
  const chartData =
    view === 'month'
      ? attendance
      : quarterly.map((q) => ({
          label: q.quarter,
          month: 0,
          attendance_rate: q.attendance_rate,
          late_rate: 0,
          overtime_hours: q.overtime_hours,
          avg_work_hours: 0,
          total_records: 0,
          leave_requests: q.leave_requests,
        }));

  const headcountChartData =
    view === 'month'
      ? headcount
      : quarterly.map((q, i) => {
          const months = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [9, 10, 11],
          ][i];
          return {
            label: q.quarter,
            headcount: headcount[months[2]]?.headcount ?? 0,
            new_hires: months.reduce((s, m) => s + (headcount[m]?.new_hires ?? 0), 0),
          };
        });

  const leaveChartData =
    view === 'month'
      ? leaves
      : quarterly.map((q, i) => {
          const months = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [9, 10, 11],
          ][i];
          const combined = months.reduce(
            (acc, m) => {
              const l = leaves[m];
              if (!l) return acc;
              acc.total += l.total;
              acc.approved += l.approved;
              acc.pending += l.pending;
              acc.annual = (acc.annual ?? 0) + (l.annual ?? 0);
              acc.sick = (acc.sick ?? 0) + (l.sick ?? 0);
              return acc;
            },
            { label: q.quarter, total: 0, approved: 0, pending: 0, annual: 0, sick: 0 } as any,
          );
          return combined;
        });

  if (isLoading) {
    return (
      <Stack gap="xl">
        <Group justify="space-between">
          <Skeleton h={32} w={200} />
          <Skeleton h={32} w={160} />
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Skeleton h={100} radius="md" />
          <Skeleton h={100} radius="md" />
          <Skeleton h={100} radius="md" />
          <Skeleton h={100} radius="md" />
        </SimpleGrid>
        <Grid>
          <Grid.Col span={8}>
            <Skeleton h={280} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton h={280} radius="md" />
          </Grid.Col>
        </Grid>
        <Grid>
          <Grid.Col span={6}>
            <Skeleton h={260} radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <Skeleton h={260} radius="md" />
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {/* header */}
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={2}>Analytics Overview</Title>
          <Text c="dimmed" size="sm">
            Workforce & attendance insights for {year}
          </Text>
        </Stack>
        <Group gap="sm">
          <SegmentedControl
            size="xs"
            value={view}
            onChange={(v) => setView(v as any)}
            data={[
              { value: 'month', label: 'Monthly' },
              { value: 'quarter', label: 'Quarterly' },
            ]}
          />
          <Select
            size="xs"
            w={90}
            value={String(year)}
            onChange={(v) => v && setYear(Number(v))}
            data={yearOptions}
            checkIconPosition="right"
          />
          <Tooltip label="Refresh data">
            <ActionIcon variant="light" size="sm" onClick={() => refetch()}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <KpiCard
          icon={<IconUsers size={18} />}
          color="blue"
          label="Total Headcount"
          value={summary?.total_employees ?? 0}
          sub={`${summary?.active} active · ${summary?.inactive} inactive`}
          delta={headDelta}
        />
        <KpiCard
          icon={<IconUserPlus size={18} />}
          color="teal"
          label="New Hires"
          value={summary?.new_hires_this_year ?? 0}
          sub={`in ${year}`}
        />
        <KpiCard
          icon={<IconCalendarCheck size={18} />}
          color="green"
          label="Avg Attendance"
          value={`${curAtt?.attendance_rate ?? 0}%`}
          sub="this month"
          delta={attRateDelta}
        />
        <KpiCard
          icon={<IconAlertTriangle size={18} />}
          color="orange"
          label="Late Rate"
          value={`${curAtt?.late_rate ?? 0}%`}
          sub="this month"
          delta={lateRateDelta !== null ? -lateRateDelta : null}
        />
      </SimpleGrid>

      {/* headcount trend + dept breakdown */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="md">
            <SectionTitle>Headcount Trend & New Hires</SectionTitle>
            <Text size="xs" c="dimmed" mb="md">
              Track workforce growth and hiring velocity over time
            </Text>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart
                data={headcountChartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: textColor }}
                />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="headcount"
                  name="Headcount"
                  fill="rgba(51,154,240,0.15)"
                  stroke="#339af0"
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="right"
                  dataKey="new_hires"
                  name="New Hires"
                  fill="#12b886"
                  radius={[3, 3, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <SectionTitle>Department Breakdown</SectionTitle>
            <Text size="xs" c="dimmed" mb="md">
              Active vs total headcount per department
            </Text>
            <Stack gap="sm">
              {depts
                .sort((a, b) => b.total - a.total)
                .map((d) => (
                  <div key={d.id}>
                    <Group justify="space-between" mb={4}>
                      <Group gap={6} wrap="nowrap">
                        <ThemeIcon size={20} radius="sm" color="blue" variant="light">
                          <IconBuilding size={11} />
                        </ThemeIcon>
                        <Text size="xs" lineClamp={1}>
                          {d.name}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {d.active}/{d.total}
                      </Text>
                    </Group>
                    <Progress.Root size={6} radius="xl">
                      <Progress.Section value={(d.active / d.total) * 100} color="teal" />
                      <Progress.Section value={(d.inactive / d.total) * 100} color="red" />
                    </Progress.Root>
                    <Group gap={4} mt={3}>
                      {Object.entries(d.levels).map(([level, count]) => (
                        <Badge
                          key={level}
                          size="xs"
                          variant="dot"
                          color={LEVEL_COLORS[level] ? 'blue' : 'gray'}
                          style={{ color: LEVEL_COLORS[level] }}
                        >
                          {level} {count}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* attendance trend */}
      <Card withBorder radius="md" p="md">
        <SectionTitle>Attendance & Punctuality Trend</SectionTitle>
        <Text size="xs" c="dimmed" mb="md">
          Attendance rate vs late rate — spot patterns and problem periods
        </Text>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} domain={[0, 100]} unit="%" />
            <RTooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="attendance_rate"
              name="Attendance Rate"
              stroke="#12b886"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="late_rate"
              name="Late Rate"
              stroke="#f59f00"
              strokeWidth={2}
              dot={{ r: 3 }}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* leave trend + overtime */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="md" p="md">
            <SectionTitle>Leave Request Trend</SectionTitle>
            <Text size="xs" c="dimmed" mb="md">
              Volume and approval rate of leave requests over time
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaveChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="approved"
                  name="Approved"
                  stackId="a"
                  fill="#12b886"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  stackId="a"
                  fill="#f59f00"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="annual"
                  name="Annual"
                  stackId="b"
                  fill={LEAVE_COLORS.annual}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="sick"
                  name="Sick"
                  stackId="b"
                  fill={LEAVE_COLORS.sick}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <SectionTitle>Quarterly Summary</SectionTitle>
            <Text size="xs" c="dimmed" mb="md">
              High-level performance by quarter
            </Text>
            <Stack gap="md">
              {quarterly.map((q) => (
                <Paper key={q.quarter} withBorder p="sm" radius="sm">
                  <Group justify="space-between" mb={6}>
                    <Text fw={700} size="sm">
                      {q.quarter}
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color={
                        q.attendance_rate >= 85
                          ? 'teal'
                          : q.attendance_rate >= 70
                            ? 'orange'
                            : 'red'
                      }
                    >
                      {q.attendance_rate}% attendance
                    </Badge>
                  </Group>
                  <Group gap="xl">
                    <Stack gap={0} align="center">
                      <Text fw={700} size="md" c="violet">
                        {q.overtime_hours}h
                      </Text>
                      <Text size="10px" c="dimmed">
                        Overtime
                      </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                      <Text fw={700} size="md" c="blue">
                        {q.leave_requests}
                      </Text>
                      <Text size="10px" c="dimmed">
                        Leave Reqs
                      </Text>
                    </Stack>
                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                      <Progress
                        value={q.attendance_rate}
                        color={q.attendance_rate >= 85 ? 'teal' : 'orange'}
                        size="sm"
                        radius="xl"
                        w="100%"
                      />
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* overtime trend */}
      <Card withBorder radius="md" p="md">
        <SectionTitle>Overtime Hours Trend</SectionTitle>
        <Text size="xs" c="dimmed" mb="md">
          Total overtime hours across the organization — identify overwork periods
        </Text>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} />
            <RTooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="overtime_hours"
              name="Overtime (h)"
              stroke="#7950f2"
              fill="rgba(121,80,242,0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </Stack>
  );
}

// ─── EMPLOYEE dashboard ───────────────────────────────────────────────────────

function EmployeeDashboard() {
  const { user } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const gridColor = dark ? '#373A40' : '#e9ecef';
  const textColor = dark ? '#909296' : '#868e96';
  const tooltipStyle = {
    background: dark ? '#25262b' : '#fff',
    border: `1px solid ${gridColor}`,
    borderRadius: 8,
    fontSize: 12,
  };

  const { data: myData, isLoading: _myLoading } = useGetMyAttendance(CURRENT_MONTH, CURRENT_YEAR);
  const { data: leaveData, isLoading: _leaveLoading } = useGetLeaveRequests();
  const isLoading = useDelayedLoading(_myLoading || _leaveLoading);

  const summary = myData?.summary;
  const records = myData?.records ?? [];
  const leaves = leaveData?.data ?? [];

  const attendanceRate =
    summary && summary.plan_day > 0 ? Math.round((summary.actual_day / summary.plan_day) * 100) : 0;

  // daily work hours chart
  const dailyData = records.map((r) => ({
    date: new Date(r.work_date ?? '').toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }),
    hours: Math.round((((r as any).work_minutes ?? 0) / 60) * 10) / 10,
    late: r.late ?? 0,
    overtime: Math.round((((r as any).overtime ?? 0) / 60) * 10) / 10,
  }));

  // leave by type pie
  const leaveByType = leaves.reduce<Record<string, number>>((acc, l) => {
    acc[l.leave_type] = (acc[l.leave_type] ?? 0) + 1;
    return acc;
  }, {});
  const leavePieData = Object.entries(leaveByType).map(([type, count]) => ({ type, count }));

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;

  if (isLoading) {
    return (
      <Stack gap="xl">
        <Skeleton h={32} w={240} />
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={100} radius="md" />
          ))}
        </SimpleGrid>
        <Grid>
          <Grid.Col span={8}>
            <Skeleton h={260} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton h={260} radius="md" />
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Stack gap={2}>
        <Title order={2}>Hi {user?.email?.split('@')[0]} 👋</Title>
        <Text c="dimmed" size="sm">
          {now.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <KpiCard
          icon={<IconCalendarCheck size={18} />}
          color="teal"
          label="Days Worked"
          value={summary?.actual_day ?? 0}
          sub={`of ${summary?.plan_day ?? 0} planned`}
        />
        <KpiCard
          icon={<IconAlertTriangle size={18} />}
          color="orange"
          label="Late Arrivals"
          value={summary?.late ?? 0}
          sub="this month"
        />
        <KpiCard
          icon={<IconCalendarOff size={18} />}
          color="blue"
          label="Leave Requests"
          value={leaves.length}
          sub={`${pendingCount} pending · ${approvedCount} approved`}
        />
        <KpiCard
          icon={<IconClock size={18} />}
          color="violet"
          label="Overtime"
          value={`${Math.round((summary?.over_time ?? 0) / 60)}h`}
          sub="this month"
        />
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="md">
            <SectionTitle>Daily Work Hours This Month</SectionTitle>
            <Text size="xs" c="dimmed" mb="md">
              Your work hours, late minutes and overtime per day
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={dailyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} interval={2} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: textColor }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: textColor }}
                />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="hours"
                  name="Work Hours"
                  fill="#339af0"
                  radius={[3, 3, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="late"
                  name="Late (min)"
                  stroke="#f59f00"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="overtime"
                  name="OT Hours"
                  stroke="#7950f2"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" p="md" h="100%">
            <SectionTitle>Attendance Rate</SectionTitle>
            <Stack align="center" gap="md" mt="sm">
              <RingProgress
                size={130}
                thickness={14}
                sections={[
                  {
                    value: attendanceRate,
                    color: attendanceRate >= 90 ? 'teal' : attendanceRate >= 70 ? 'orange' : 'red',
                  },
                ]}
                label={
                  <Stack gap={0} align="center">
                    <Text fw={800} size="xl">
                      {attendanceRate}%
                    </Text>
                    <Text size="10px" c="dimmed">
                      this month
                    </Text>
                  </Stack>
                }
              />
              <Divider w="100%" />
              {leavePieData.length > 0 ? (
                <>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    Leave by Type
                  </Text>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={leavePieData}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                      >
                        {leavePieData.map((entry, i) => (
                          <Cell key={i} fill={LEAVE_COLORS[entry.type] ?? '#868e96'} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <Text size="xs" c="dimmed" ta="center">
                  No leave requests yet
                </Text>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdminOrManager = roles.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN].includes(r as any),
  );
  return isAdminOrManager ? <AdminDashboard /> : <EmployeeDashboard />;
}
