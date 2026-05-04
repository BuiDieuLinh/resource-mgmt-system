import { useState } from 'react';
import {
  Stack,
  Card,
  Text,
  Badge,
  Group,
  Progress,
  Loader,
  Center,
  Grid,
  ThemeIcon,
  Alert,
  Paper,
  SimpleGrid,
  RingProgress,
} from '@mantine/core';
import {
  IconStar,
  IconTrophy,
  IconInfoCircle,
  IconCalendar,
  IconClock,
  IconAlertCircle,
  IconChecks,
  IconChartBar,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useGetCycles } from '../api';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { IPerformanceReview } from '../types';

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  published: 'Published',
};

export default function MyReviewsPage() {
  const { data: cycles = [] } = useGetCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const { data: myReview, isLoading } = useQuery<IPerformanceReview | null>({
    queryKey: ['my-review', selectedCycleId],
    queryFn: () =>
      apiClient
        .get(`performance/cycles/${selectedCycleId}/my-review`)
        .then((r) => r.data?.data ?? null),
    enabled: !!selectedCycleId,
  });

  const publishedCycles = cycles.filter((c) => {
    const announceDate = new Date(c.announce_date);
    return announceDate <= new Date();
  });

  const getGradeInfo = (score?: number) => {
    if (!score) return { label: 'N/A', color: 'gray', progress: 0 };
    if (score >= 90) return { label: 'Excellent', color: 'green', progress: 100 };
    if (score >= 75) return { label: 'Good', color: 'blue', progress: 80 };
    if (score >= 60) return { label: 'Average', color: 'yellow', progress: 60 };
    return { label: 'Below Average', color: 'red', progress: 40 };
  };

  const gradeInfo = getGradeInfo(myReview?.total_score);

  return (
    <Stack gap="lg">
      <PageHeader
        title="My Performance Reviews"
        description="View your performance evaluation history and feedback"
      />

      <Grid gutter="lg">
        {/* Sidebar - Cycle List */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="md" style={{ position: 'sticky', top: 20 }}>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Review Cycles</Text>
              <Badge variant="light">{publishedCycles.length}</Badge>
            </Group>

            {publishedCycles.length === 0 ? (
              <Center h={100}>
                <Stack align="center" gap="xs">
                  <IconInfoCircle size={32} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed" ta="center">
                    No published cycles yet
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="xs" style={{ maxHeight: 500, overflowY: 'auto' }}>
                {publishedCycles.map((cycle) => (
                  <Paper
                    key={cycle.id}
                    p="sm"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      background:
                        selectedCycleId === cycle.id
                          ? 'var(--mantine-color-blue-0)'
                          : 'transparent',
                      borderColor:
                        selectedCycleId === cycle.id
                          ? 'var(--mantine-color-blue-3)'
                          : 'var(--mantine-color-gray-3)',
                    }}
                    onClick={() => setSelectedCycleId(cycle.id)}
                  >
                    <Stack gap={6}>
                      <Text size="sm" fw={500}>
                        {cycle.title}
                      </Text>
                      <Group gap="xs">
                        <IconCalendar size={12} />
                        <Text size="xs" c="dimmed">
                          {new Date(cycle.announce_date).toLocaleDateString('en-GB')}
                        </Text>
                      </Group>
                      {cycle.template && (
                        <Badge size="xs" variant="light" color="cyan">
                          {cycle.template.title}
                        </Badge>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Main Content - Review Detail */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {!selectedCycleId ? (
            <Card withBorder p="xl">
              <Center h={300}>
                <Stack align="center" gap="md">
                  <ThemeIcon size={80} variant="light" color="blue" radius="xl">
                    <IconChartBar size={40} />
                  </ThemeIcon>
                  <Stack align="center" gap={4}>
                    <Text size="lg" fw={600}>
                      Select a Review Cycle
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Choose a cycle from the sidebar to view your performance review
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            </Card>
          ) : isLoading ? (
            <Center h={300}>
              <Loader size="lg" />
            </Center>
          ) : !myReview ? (
            <Card withBorder p="xl">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text fw={500} mb={4}>
                  No Review Available
                </Text>
                <Text size="sm">
                  Your performance review for this cycle has not been completed yet.
                </Text>
              </Alert>
            </Card>
          ) : (
            <Stack gap="md">
              {/* Status & Score Overview */}
              <Card withBorder p="lg">
                <Grid gutter="xl">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                        Review Status
                      </Text>
                      <Badge size="xl" color={STATUS_COLOR[myReview.status]} variant="light">
                        {STATUS_LABEL[myReview.status]}
                      </Badge>
                      {myReview.status !== 'published' && (
                        <Text size="xs" c="dimmed">
                          Your review is being processed
                        </Text>
                      )}
                    </Stack>
                  </Grid.Col>

                  {myReview.status === 'published' && myReview.total_score !== undefined && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group justify="center">
                        <RingProgress
                          size={140}
                          thickness={14}
                          sections={[{ value: myReview.total_score, color: gradeInfo.color }]}
                          label={
                            <Stack align="center" gap={0}>
                              <Text size="xl" fw={700}>
                                {myReview.total_score}
                              </Text>
                              <Text size="xs" c="dimmed">
                                out of 100
                              </Text>
                            </Stack>
                          }
                        />
                      </Group>
                    </Grid.Col>
                  )}
                </Grid>
              </Card>

              {/* Performance Grade */}
              {myReview.status === 'published' && myReview.total_score !== undefined && (
                <Card withBorder p="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <ThemeIcon size="lg" color={gradeInfo.color} variant="light">
                        <IconStar size={20} />
                      </ThemeIcon>
                      <div>
                        <Text size="sm" c="dimmed">
                          Performance Grade
                        </Text>
                        <Text size="lg" fw={700}>
                          {gradeInfo.label}
                        </Text>
                      </div>
                    </Group>
                    <Badge size="lg" color={gradeInfo.color} variant="filled">
                      {myReview.total_score} / 100
                    </Badge>
                  </Group>
                  <Progress value={gradeInfo.progress} color={gradeInfo.color} size="xl" />
                </Card>
              )}

              {/* Criteria Scores */}
              {myReview.status === 'published' &&
                myReview.score_details &&
                myReview.score_details.length > 0 && (
                  <Card withBorder p="md">
                    <Group mb="md">
                      <IconChecks size={20} />
                      <Text fw={600}>Detailed Evaluation</Text>
                    </Group>
                    <Stack gap="md">
                      {myReview.score_details.map((detail, idx) => {
                        const percentage = (detail.score / detail.max_score) * 100;
                        const color =
                          percentage >= 80 ? 'green' : percentage >= 60 ? 'blue' : 'orange';

                        return (
                          <Paper key={detail.id} p="md" withBorder>
                            <Stack gap="sm">
                              <Group justify="space-between">
                                <div style={{ flex: 1 }}>
                                  <Text fw={500} size="sm">
                                    {idx + 1}. {detail.criteria_name}
                                  </Text>
                                  <Group gap="xs" mt={4}>
                                    <Badge size="xs" variant="light" color="blue">
                                      Weight: {detail.weight}%
                                    </Badge>
                                    <Badge size="xs" variant="light" color={color}>
                                      {detail.score} / {detail.max_score}
                                    </Badge>
                                  </Group>
                                </div>
                                <ThemeIcon size="lg" color={color} variant="light">
                                  <Text size="sm" fw={700}>
                                    {Math.round(percentage)}%
                                  </Text>
                                </ThemeIcon>
                              </Group>
                              <Progress value={percentage} color={color} size="md" />
                              {detail.note && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  💬 {detail.note}
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Card>
                )}

              {/* Feedback */}
              {myReview.status === 'published' && (
                <>
                  {myReview.achievements && (
                    <Card withBorder p="md">
                      <Group mb="sm">
                        <IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
                        <Text fw={600}>Key Achievements</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {myReview.achievements}
                      </Text>
                    </Card>
                  )}

                  {myReview.comment && (
                    <Card withBorder p="md">
                      <Group mb="sm">
                        <IconInfoCircle size={20} color="var(--mantine-color-blue-6)" />
                        <Text fw={600}>Manager Feedback</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {myReview.comment}
                      </Text>
                    </Card>
                  )}
                </>
              )}

              {/* Attendance Summary */}
              <Card withBorder p="md">
                <Group mb="md">
                  <IconClock size={20} />
                  <Text fw={600}>Attendance Summary</Text>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  <Paper p="sm" withBorder>
                    <Stack gap={4} align="center">
                      <Text size="xs" c="dimmed" ta="center">
                        Days Present
                      </Text>
                      <Text size="xl" fw={700} c="green">
                        {myReview.attendance_days ?? 0}
                      </Text>
                    </Stack>
                  </Paper>
                  <Paper p="sm" withBorder>
                    <Stack gap={4} align="center">
                      <Text size="xs" c="dimmed" ta="center">
                        Late Count
                      </Text>
                      <Text
                        size="xl"
                        fw={700}
                        c={myReview.late_count && myReview.late_count > 0 ? 'orange' : 'gray'}
                      >
                        {myReview.late_count ?? 0}
                      </Text>
                    </Stack>
                  </Paper>
                  <Paper p="sm" withBorder>
                    <Stack gap={4} align="center">
                      <Text size="xs" c="dimmed" ta="center">
                        Absent Count
                      </Text>
                      <Text
                        size="xl"
                        fw={700}
                        c={myReview.absent_count && myReview.absent_count > 0 ? 'red' : 'gray'}
                      >
                        {myReview.absent_count ?? 0}
                      </Text>
                    </Stack>
                  </Paper>
                  <Paper p="sm" withBorder>
                    <Stack gap={4} align="center">
                      <Text size="xs" c="dimmed" ta="center">
                        Overtime (hrs)
                      </Text>
                      <Text size="xl" fw={700} c="blue">
                        {((myReview.overtime_minutes ?? 0) / 60).toFixed(1)}
                      </Text>
                    </Stack>
                  </Paper>
                </SimpleGrid>
              </Card>

              {/* Draft/Submitted Notice */}
              {myReview.status !== 'published' && (
                <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                  <Text fw={500} size="sm">
                    Review In Progress
                  </Text>
                  <Text size="xs" mt={4}>
                    Your manager is currently working on your performance review. You'll be notified
                    once it's published.
                  </Text>
                </Alert>
              )}
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
