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
  Divider,
  SimpleGrid,
  useMantineColorScheme,
  Paper,
  Tabs,
} from '@mantine/core';
import {
  IconUsers,
  IconCalendarCheck,
  IconCalendarOff,
  IconClock,
  IconTrendingUp,
  IconAlertTriangle,
  IconChartBar,
  IconBulbFilled,
} from '@tabler/icons-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useGetMyAttendance } from '@/modules/attendances/api/get-my-attendance';
import { useGetLeaveRequests } from '@/modules/leave-requests/api/get-leave-requests';
import { getHrStructure, getTurnoverReport, getInsights } from '@/modules/reports/api/hr-reports';
import type { AlertInsight } from '@/modules/reports/api/hr-reports';
import { EMPLOYEE_ROLE } from '@/constant';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQuery } from '@tanstack/react-query';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const LEAVE_COLORS: Record<string, string> = {
  annual: '#339af0',
  sick: '#f03e3e',
  maternity: '#f59f00',
  paternity: '#12b886',
  unpaid: '#868e96',
};

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

  const { data: hrData, isLoading: hrLoading } = useQuery({
    queryKey: ['hr-structure'],
    queryFn: () => getHrStructure(),
  });

  const { data: turnoverData, isLoading: turnoverLoading } = useQuery({
    queryKey: ['turnover', CURRENT_YEAR],
    queryFn: () => getTurnoverReport({ period: 'month', year: CURRENT_YEAR }),
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getInsights(),
  });

  const isLoading = useDelayedLoading(hrLoading || turnoverLoading || insightsLoading);

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
            <Skeleton h={300} radius="md" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Skeleton h={300} radius="md" />
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  const hrStructure = hrData?.data;
  const turnover = turnoverData?.data;
  const insights = insightsData?.data || [];

  return (
    <Stack gap="xl">
      <Stack gap={2}>
        <Title order={2}>Analytics Overview</Title>
        <Text c="dimmed" size="sm">
          Comprehensive workforce insights and trends
        </Text>
      </Stack>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Total Employees
            </Text>
            <ThemeIcon size={32} radius="md" color="blue" variant="light">
              <IconUsers size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl">
            {hrStructure?.totalEmployees || 0}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Active employees
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              New Hires
            </Text>
            <ThemeIcon size={32} radius="md" color="teal" variant="light">
              <IconTrendingUp size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" c="teal">
            {turnover?.summary.totalNewHires || 0}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            This year
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Turnover Rate
            </Text>
            <ThemeIcon size={32} radius="md" color="orange" variant="light">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" c="orange">
            {turnover?.summary.averageTurnoverRate.toFixed(1) || 0}%
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Average this year
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Avg Tenure
            </Text>
            <ThemeIcon size={32} radius="md" color="violet" variant="light">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" c="violet">
            {turnover?.summary.averageTenureMonths || 0}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Months
          </Text>
        </Card>
      </SimpleGrid>

      {/* HR Structure */}
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={700} size="sm">
              HR Structure Overview
            </Text>
            <Text size="xs" c="dimmed">
              Employee distribution across departments and demographics
            </Text>
          </div>
          <ThemeIcon size={32} radius="md" color="blue" variant="light">
            <IconChartBar size={18} />
          </ThemeIcon>
        </Group>

        <Tabs defaultValue="department">
          <Tabs.List>
            <Tabs.Tab value="department">Departments</Tabs.Tab>
            <Tabs.Tab value="age">Age Groups</Tabs.Tab>
            <Tabs.Tab value="tenure">Tenure</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="department" pt="md">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hrStructure?.byDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="departmentName" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="employeeCount" fill="#0088FE" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </Tabs.Panel>

          <Tabs.Panel value="age" pt="md">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={hrStructure?.byAge || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.ageGroup}: ${entry.employeeCount}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="employeeCount"
                >
                  {(hrStructure?.byAge || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Tabs.Panel>

          <Tabs.Panel value="tenure" pt="md">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hrStructure?.byTenure || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="tenureGroup" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="employeeCount" fill="#00C49F" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </Tabs.Panel>
        </Tabs>
      </Card>

      {/* Turnover Trend */}
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={700} size="sm">
              Turnover & Retention Trend
            </Text>
            <Text size="xs" c="dimmed">
              Monthly turnover and retention rates
            </Text>
          </div>
        </Group>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={turnover?.data || []}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} />
            <RTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="turnoverRate"
              stroke="#FF8042"
              name="Turnover Rate (%)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="retentionRate"
              stroke="#00C49F"
              name="Retention Rate (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700} size="sm">
                AI Insights & Correlations
              </Text>
              <Text size="xs" c="dimmed">
                Automated analysis of workforce patterns
              </Text>
            </div>
            <ThemeIcon size={32} radius="md" color="yellow" variant="light">
              <IconBulbFilled size={18} />
            </ThemeIcon>
          </Group>
          <Stack gap="md">
            {insights.slice(0, 3).map((insight: AlertInsight, index: number) => (
              <Paper key={index} withBorder p="sm" radius="sm">
                <Group justify="space-between" mb={4}>
                  <Text fw={600} size="sm">
                    {insight.title}
                  </Text>
                  <Badge
                    size="sm"
                    color={
                      insight.correlation >= 0.7
                        ? 'red'
                        : insight.correlation >= 0.5
                          ? 'orange'
                          : 'yellow'
                    }
                  >
                    {(insight.correlation * 100).toFixed(0)}% correlation
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {insight.description}
                </Text>
                {insight.recommendation && (
                  <Text size="xs" c="blue" mt={4}>
                    💡 {insight.recommendation}
                  </Text>
                )}
              </Paper>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

// ─── EMPLOYEE dashboard ───────────────────────────────────────────────────────

function EmployeeDashboard() {
  const { user } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const gridColor = dark ? '#373A40' : '#e9ecef';
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
        <Title order={2}>Dashboard</Title>
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
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Days Worked
            </Text>
            <ThemeIcon size={32} radius="md" color="teal" variant="light">
              <IconCalendarCheck size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl">
            {summary?.actual_day ?? 0}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            of {summary?.plan_day ?? 0} planned
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Late Arrivals
            </Text>
            <ThemeIcon size={32} radius="md" color="orange" variant="light">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" c="orange">
            {summary?.late ?? 0}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            this month
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Leave Requests
            </Text>
            <ThemeIcon size={32} radius="md" color="blue" variant="light">
              <IconCalendarOff size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl">
            {leaves.length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {pendingCount} pending · {approvedCount} approved
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb={8}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Overtime
            </Text>
            <ThemeIcon size={32} radius="md" color="violet" variant="light">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={800} size="xl" c="violet">
            {Math.round((summary?.over_time ?? 0) / 60)}h
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            this month
          </Text>
        </Card>
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="md">
            <Text fw={700} size="sm" mb="xs">
              Daily Work Hours This Month
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              Your work hours, late minutes and overtime per day
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={dailyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
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
            <Text fw={700} size="sm" mb="md">
              Attendance Rate
            </Text>
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
