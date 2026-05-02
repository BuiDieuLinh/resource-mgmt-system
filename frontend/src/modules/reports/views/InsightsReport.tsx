import { useState, useEffect } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Loader,
  Center,
  Progress,
  Alert,
} from '@mantine/core';
import { IconBulbFilled, IconTrendingUp, IconAlertTriangle } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { getInsights, type AlertInsight } from '../api/hr-reports';

export default function InsightsReport() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AlertInsight[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getInsights();
      setInsights(result.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (correlation: number) => {
    if (correlation >= 0.7) return 'red';
    if (correlation >= 0.5) return 'orange';
    return 'yellow';
  };

  const getCorrelationLabel = (correlation: number) => {
    if (correlation >= 0.7) return 'High Correlation';
    if (correlation >= 0.5) return 'Medium Correlation';
    return 'Low Correlation';
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <PageHeader title="Insights & Correlation Analysis" />

      {/* Insights List */}
      {insights.length === 0 ? (
        <Paper shadow="sm" p="xl" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <IconBulbFilled size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" ta="center">
                No insights detected yet.
                <br />
                The system will automatically analyze when sufficient data is available.
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="lg">
          {insights.map((insight, index) => (
            <Paper
              key={index}
              shadow="sm"
              p="lg"
              withBorder
              style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }}
            >
              <Group justify="space-between" mb="md">
                <Group>
                  <Paper p="sm" bg="blue.0" radius="md">
                    <IconTrendingUp size={24} color="var(--mantine-color-blue-6)" />
                  </Paper>
                  <div>
                    <Title order={4}>{insight.title}</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                      {insight.description}
                    </Text>
                  </div>
                </Group>
                <Badge color={getCorrelationColor(insight.correlation)} variant="outline">
                  {getCorrelationLabel(insight.correlation)}
                </Badge>
              </Group>

              <Stack gap="md">
                {/* Correlation Strength */}
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed">
                      Correlation Strength
                    </Text>
                    <Text size="sm" fw={500}>
                      {(insight.correlation * 100).toFixed(0)}%
                    </Text>
                  </Group>
                  <Progress
                    value={insight.correlation * 100}
                    color={getCorrelationColor(insight.correlation)}
                  />
                </div>

                {/* Affected Employees */}
                {insight.affectedEmployees && (
                  <Group gap="xs">
                    <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
                    <Text size="sm" c="dimmed">
                      Affects{' '}
                      <Text component="span" fw={600} c="dark">
                        {insight.affectedEmployees}
                      </Text>{' '}
                      employees
                    </Text>
                  </Group>
                )}

                {/* Recommendation */}
                {insight.recommendation && (
                  <Alert
                    icon={<IconBulbFilled size={16} />}
                    title="Recommendation"
                    color="blue"
                    variant="light"
                  >
                    {insight.recommendation}
                  </Alert>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Info Card */}
      <Paper shadow="sm" p="md" withBorder bg="gray.0">
        <Title order={5} mb="md">
          💡 About Automatic Insights
        </Title>
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            The system automatically analyzes correlations between:
          </Text>
          <Stack gap={4} ml="md">
            <Text size="sm" c="dimmed">
              • Attendance and work performance (KPI)
            </Text>
            <Text size="sm" c="dimmed">
              • Turnover rate and average department KPI
            </Text>
            <Text size="sm" c="dimmed">
              • Tenure and turnover rate
            </Text>
            <Text size="sm" c="dimmed">
              • Work shifts and absence status
            </Text>
          </Stack>
          <Text size="sm" c="dimmed" mt="sm">
            Insights are updated daily based on actual data.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
