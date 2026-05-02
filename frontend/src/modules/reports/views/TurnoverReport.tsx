import { useState, useEffect } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  Select,
  Group,
  Loader,
  Center,
  SimpleGrid,
  Alert,
} from '@mantine/core';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconUserMinus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { getTurnoverReport } from '../api/hr-reports';
import type { TurnoverResponse } from '../api/hr-reports';

export default function TurnoverReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TurnoverResponse | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadData();
  }, [period, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getTurnoverReport({ period, year: parseInt(year) });
      setData(result.data);
    } catch (error) {
      console.error('Failed to load turnover report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!data) {
    return (
      <Center h={400}>
        <Text c="dimmed">Không có dữ liệu</Text>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <PageHeader title="Employee Turnover Report" />
        <Group>
          <Select
            value={period}
            onChange={(value: any) => setPeriod(value)}
            data={[
              { value: 'month', label: 'By Month' },
              { value: 'quarter', label: 'By Quarter' },
              { value: 'year', label: 'By Year' },
            ]}
            w={180}
          />
          <Select
            value={year}
            onChange={(value: any) => setYear(value)}
            data={['2024', '2025', '2026']}
            w={120}
          />
        </Group>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                New Hires
              </Text>
              <Title order={2} c="green">
                {data.summary.totalNewHires}
              </Title>
              <Text size="xs" c="dimmed">
                New employees in period
              </Text>
            </div>
            <IconUsers size={32} stroke={1.5} color="var(--mantine-color-green-6)" />
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Terminations
              </Text>
              <Title order={2} c="red">
                {data.summary.totalTerminations}
              </Title>
              <Text size="xs" c="dimmed">
                Employees left in period
              </Text>
            </div>
            <IconUserMinus size={32} stroke={1.5} color="var(--mantine-color-red-6)" />
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Turnover Rate
              </Text>
              <Title order={2} c="orange">
                {data.summary.averageTurnoverRate.toFixed(1)}%
              </Title>
              <Text size="xs" c="dimmed">
                Average turnover rate
              </Text>
            </div>
            <IconTrendingUp size={32} stroke={1.5} color="var(--mantine-color-orange-6)" />
          </Group>
        </Paper>

        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Avg Tenure
              </Text>
              <Title order={2} c="blue">
                {data.summary.averageTenureMonths} months
              </Title>
              <Text size="xs" c="dimmed">
                Average time of service
              </Text>
            </div>
            <IconTrendingDown size={32} stroke={1.5} color="var(--mantine-color-blue-6)" />
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Turnover Rate Chart */}
      <Paper shadow="sm" p="md" withBorder>
        <Title order={4} mb="md">
          Turnover Rate Chart
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Turnover and retention rates over time
        </Text>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
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
      </Paper>

      {/* New Hires vs Terminations Chart */}
      <Paper shadow="sm" p="md" withBorder>
        <Title order={4} mb="md">
          New Hires vs Terminations Chart
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Comparison of new hires and terminations
        </Text>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="newHires" fill="#00C49F" name="New Hires" />
            <Bar dataKey="terminations" fill="#FF8042" name="Terminations" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Alert if turnover is high */}
      {data.summary.averageTurnoverRate > 5 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="⚠️ Warning" color="red">
          Average turnover rate ({data.summary.averageTurnoverRate.toFixed(1)}%) exceeds the warning
          threshold of 5%. Consider implementing measures to improve work environment and employee
          retention policies.
        </Alert>
      )}
    </Stack>
  );
}
