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
  Select,
  Box,
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
import { useMemo, useState } from 'react';
import { useGetAllDepartments } from '@/modules/departments/api/get-departments';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function MetricCard({
  label,
  value,
  hint,
  color,
  iconColor,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  color: string;
  iconColor: string;
  icon: React.ReactNode;
}) {
  return (
    <Card
      radius="lg"
      p="lg"
      style={{
        background: `linear-gradient(145deg, ${color}12 0%, rgba(255,255,255,0.98) 62%)`,
        border: '1px solid rgba(148,163,184,0.16)',
        boxShadow: '0 10px 24px -22px rgba(15,23,42,0.28)',
      }}
    >
      <Group justify="space-between" align="flex-start" mb="sm">
        <Box>
          <Text size="xs" fw={600} tt="uppercase" c="dimmed">
            {label}
          </Text>
          <Text fw={800} size="1.5rem" lh={1.05} mt={6}>
            {value}
          </Text>
        </Box>
        <ThemeIcon size={36} radius="md" variant="light" color={iconColor}>
          <Box style={{ transform: 'scale(0.9)' }}>{icon}</Box>
        </ThemeIcon>
      </Group>
      <Text size="xs" c="dimmed" fw={500}>
        {hint}
      </Text>
    </Card>
  );
}

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
  const isAdmin = roles.some((r) => [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR].includes(r as any));
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const reportYear = Number(selectedYear);

  const { data: departmentsData } = useGetAllDepartments({
    enabled: isAdmin,
  });

  const departmentOptions = useMemo(
    () => [
      { value: '', label: 'All departments' },
      ...((departmentsData?.data ?? []).map((department) => ({
        value: department.id,
        label: department.department_name,
      })) ?? []),
    ],
    [departmentsData],
  );

  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const year = CURRENT_YEAR - index;
      return { value: String(year), label: String(year) };
    });
  }, []);

  const { data: hrData, isLoading: hrLoading } = useQuery({
    queryKey: ['hr-structure', selectedDepartmentId, reportYear],
    queryFn: () =>
      getHrStructure({
        endDate: `${reportYear}-12-31`,
        departmentId: selectedDepartmentId || undefined,
      }),
    enabled: isAdmin,
  });

  const { data: turnoverData, isLoading: turnoverLoading } = useQuery({
    queryKey: ['turnover', selectedDepartmentId, selectedPeriod, reportYear],
    queryFn: () =>
      getTurnoverReport({
        period: selectedPeriod,
        year: reportYear,
        departmentId: selectedDepartmentId || undefined,
      }),
    enabled: isAdmin,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', selectedDepartmentId],
    queryFn: () => getInsights({ departmentId: selectedDepartmentId || undefined }),
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
      <Card
        radius="2xl"
        p="lg"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(59,130,246,0.24), transparent 32%), linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #312e81 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Group justify="space-between" align="flex-start" gap="xl">
          <Stack gap={6} maw={620}>
            <Text size="xs" fw={700} tt="uppercase" c="rgba(255,255,255,0.58)">
              HR dashboard
            </Text>
            <Title order={2} c="white" style={{ letterSpacing: -0.8 }}>
              Workforce overview
            </Title>
            <Text c="rgba(255,255,255,0.72)" size="sm" maw={480}>
              Headcount, turnover and risk signals for the selected scope.
            </Text>
          </Stack>

          <Group gap="xl" wrap="wrap">
            <Box>
              <Text size="xs" c="rgba(255,255,255,0.5)">
                Department
              </Text>
              <Text size="sm" fw={700} c="white">
                {selectedDepartmentId
                  ? departmentOptions.find((item) => item.value === selectedDepartmentId)?.label
                  : 'All departments'}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="rgba(255,255,255,0.5)">
                Year
              </Text>
              <Text size="sm" fw={700} c="white">
                {reportYear}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="rgba(255,255,255,0.5)">
                Period
              </Text>
              <Text size="sm" fw={700} c="white" tt="capitalize">
                {selectedPeriod}
              </Text>
            </Box>
          </Group>
        </Group>
      </Card>

      <Card
        radius="lg"
        p="md"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(148,163,184,0.18)',
        }}
      >
        <Group align="end" grow>
          <Select
            label="Department"
            data={departmentOptions}
            value={selectedDepartmentId ?? ''}
            onChange={(value) => setSelectedDepartmentId(value || null)}
            searchable
            clearable={false}
          />
          <Select
            label="Year"
            data={yearOptions}
            value={selectedYear}
            onChange={(value) => {
              if (value) setSelectedYear(value);
            }}
            clearable={false}
          />
          <Select
            label="Turnover Period"
            data={[
              { value: 'month', label: 'Monthly' },
              { value: 'quarter', label: 'Quarterly' },
              { value: 'year', label: 'Yearly' },
            ]}
            value={selectedPeriod}
            onChange={(value) => {
              if (value === 'month' || value === 'quarter' || value === 'year') {
                setSelectedPeriod(value);
              }
            }}
            clearable={false}
          />
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <MetricCard
          label="Total Employees"
          value={hrStructure?.totalEmployees || 0}
          hint="Active employees in the selected scope"
          color="#2563eb"
          iconColor="blue"
          icon={<IconUsers size={20} />}
        />
        <MetricCard
          label="New Hires"
          value={turnover?.summary.totalNewHires || 0}
          hint={selectedPeriod === 'year' ? 'Across selected years' : `In ${reportYear}`}
          color="#0f766e"
          iconColor="teal"
          icon={<IconTrendingUp size={20} />}
        />
        <MetricCard
          label="Turnover Rate"
          value={`${turnover?.summary.averageTurnoverRate.toFixed(1) || 0}%`}
          hint={
            selectedPeriod === 'year' ? 'Average across selected years' : `Average in ${reportYear}`
          }
          color="#ea580c"
          iconColor="orange"
          icon={<IconAlertTriangle size={20} />}
        />
        <MetricCard
          label="Avg Tenure"
          value={turnover?.summary.averageTenureMonths || 0}
          hint="Measured in months"
          color="#7c3aed"
          iconColor="violet"
          icon={<IconClock size={20} />}
        />
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card
            radius="lg"
            p="lg"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(148,163,184,0.18)',
              height: '100%',
            }}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={800} size="md">
                  HR Structure Overview
                </Text>
                <Text size="xs" c="dimmed">
                  Employee distribution across organization layers
                </Text>
              </div>
              <ThemeIcon size={38} radius="md" color="blue" variant="light">
                <IconChartBar size={20} />
              </ThemeIcon>
            </Group>

            <Tabs defaultValue="department" variant="pills" radius="xl">
              <Tabs.List mb="md">
                <Tabs.Tab value="department">Departments</Tabs.Tab>
                <Tabs.Tab value="age">Age Groups</Tabs.Tab>
                <Tabs.Tab value="tenure">Tenure</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="department">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hrStructure?.byDepartment || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11, fill: textColor }} />
                    <YAxis tick={{ fontSize: 11, fill: textColor }} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="employeeCount" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Tabs.Panel>

              <Tabs.Panel value="age">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={hrStructure?.byAge || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.ageGroup}: ${entry.employeeCount}`}
                      outerRadius={105}
                      innerRadius={54}
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

              <Tabs.Panel value="tenure">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hrStructure?.byTenure || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="tenureGroup" tick={{ fontSize: 11, fill: textColor }} />
                    <YAxis tick={{ fontSize: 11, fill: textColor }} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="employeeCount" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card
            radius="lg"
            p="lg"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(148,163,184,0.18)',
              height: '100%',
            }}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={800} size="md">
                  Turnover & Retention Trend
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedPeriod === 'month'
                    ? 'Monthly turnover and retention rates'
                    : selectedPeriod === 'quarter'
                      ? 'Quarterly turnover and retention rates'
                      : 'Yearly turnover and retention rates'}
                </Text>
              </div>
              <Badge variant="light" color="orange">
                {selectedPeriod}
              </Badge>
            </Group>
            <ResponsiveContainer width="100%" height={336}>
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
                  stroke="#f97316"
                  name="Turnover Rate (%)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="retentionRate"
                  stroke="#0f766e"
                  name="Retention Rate (%)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
      </Grid>

      {insights.length > 0 && (
        <Card
          radius="lg"
          p="lg"
          style={{
            background: 'linear-gradient(180deg, #fffdf4 0%, #ffffff 100%)',
            border: '1px solid rgba(250,204,21,0.28)',
          }}
        >
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={800} size="md">
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
              <Paper
                key={index}
                withBorder
                p="md"
                radius="lg"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #fffef7 100%)',
                  borderColor: 'rgba(250,204,21,0.18)',
                }}
              >
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
                  <Text size="xs" c="blue" mt={8} fw={500}>
                    Recommendation: {insight.recommendation}
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
  const isAdmin = roles.some((r) => [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR].includes(r as any));

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
