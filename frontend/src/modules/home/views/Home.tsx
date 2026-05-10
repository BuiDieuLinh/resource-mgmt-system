import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Title,
  Skeleton,
  SimpleGrid,
  useMantineColorScheme,
  Paper,
  Tabs,
} from '@mantine/core';
import {
  IconUsers,
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
} from 'recharts';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { getHrStructure, getTurnoverReport, getInsights } from '../api/hr-reports';
import type { AlertInsight } from '../api/hr-reports';
import { EMPLOYEE_ROLE } from '@/constant';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useQuery } from '@tanstack/react-query';
import { ReminderWidget } from '@/modules/reminders/components/ReminderWidget';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN].includes(r as any),
  );

  const { data: hrData, isLoading: hrLoading } = useQuery({
    queryKey: ['hr-structure'],
    queryFn: () => getHrStructure(),
    enabled: isAdmin,
  });

  const { data: turnoverData, isLoading: turnoverLoading } = useQuery({
    queryKey: ['turnover', CURRENT_YEAR],
    queryFn: () => getTurnoverReport({ period: 'month', year: CURRENT_YEAR }),
    enabled: isAdmin,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getInsights(),
    enabled: isAdmin,
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

      <ReminderWidget />

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
                  {(hrStructure?.byAge || []).map((_entry, index) => (
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

export default function Home() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((r) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.SUPER_ADMIN].includes(r as any),
  );

  if (!isAdmin) {
    return (
      <Stack gap="md" align="center" justify="center" h={400}>
        <ThemeIcon size={80} radius="xl" variant="light" color="gray">
          <IconChartBar size={40} />
        </ThemeIcon>
        <Stack gap={4} align="center">
          <Text size="lg" fw={600}>
            Dashboard Access Restricted
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={400}>
            This dashboard is only available for administrators. Please contact your system
            administrator if you need access.
          </Text>
        </Stack>
      </Stack>
    );
  }

  return <AdminDashboard />;
}
