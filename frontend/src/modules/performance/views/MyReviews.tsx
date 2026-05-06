import {
  Stack,
  Text,
  Badge,
  Group,
  Box,
  Loader,
  Center,
  ThemeIcon,
  Alert,
  Collapse,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconTrophy,
  IconInfoCircle,
  IconCalendar,
  IconAlertCircle,
  IconChevronDown,
  IconChevronRight,
  IconMessageCircle,
  IconStar,
  IconClock,
  IconChecks,
} from '@tabler/icons-react';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useGetCycles, useGetMyReview } from '../api';
import type { IReviewCycle } from '../types';

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'In Progress',
  submitted: 'Under Review',
  published: 'Published',
};

function CycleReviewRow({ cycle }: { cycle: IReviewCycle }) {
  const [open, setOpen] = useState(false);
  const { data: review, isLoading } = useGetMyReview(open ? cycle.id : '');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const isPublished = review?.status === 'published';
  const hasFeedback = isPublished && (review?.comment || review?.achievements);

  const borderColor = isDark ? '#373a40' : '#dee2e6';
  const headerBg = open ? (isDark ? '#25262b' : '#f8f9fa') : isDark ? '#1a1b1e' : '#ffffff';
  const contentBg = isDark ? '#25262b' : '#f8f9fa';
  const innerItemBg = isDark ? '#1a1b1e' : '#ffffff';
  const innerItemBorder = isDark ? '#373a40' : '#dee2e6';
  const yellowBg = isDark ? 'rgba(250,176,5,0.08)' : 'var(--mantine-color-yellow-0)';
  const yellowBorder = isDark ? 'rgba(250,176,5,0.25)' : 'var(--mantine-color-yellow-2)';
  const blueBg = isDark ? 'rgba(34,139,230,0.08)' : 'var(--mantine-color-blue-0)';
  const blueBorder = isDark ? 'rgba(34,139,230,0.25)' : 'var(--mantine-color-blue-2)';

  return (
    <Box>
      <UnstyledButton w="100%" onClick={() => setOpen((o) => !o)}>
        <Group
          justify="space-between"
          align="center"
          py="sm"
          px="md"
          wrap="nowrap"
          style={{
            borderRadius: open ? '8px 8px 0 0' : 8,
            border: `1px solid ${borderColor}`,
            background: headerBg,
            transition: 'background 0.15s',
          }}
        >
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <ThemeIcon
              size="sm"
              variant="light"
              color={isPublished ? 'green' : 'gray'}
              radius="sm"
              style={{ flexShrink: 0 }}
            >
              {isPublished ? <IconChecks size={13} /> : <IconClock size={13} />}
            </ThemeIcon>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {cycle.title}
              </Text>
              <Group gap={6} mt={2}>
                <IconCalendar size={11} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">
                  {new Date(cycle.announce_date).toLocaleDateString('en-GB')}
                </Text>
                {cycle.template && (
                  <Badge size="xs" variant="light" color="cyan">
                    {cycle.template.title}
                  </Badge>
                )}
              </Group>
            </Box>
          </Group>

          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {review && (
              <Badge size="xs" color={STATUS_COLOR[review.status]} variant="dot">
                {STATUS_LABEL[review.status]}
              </Badge>
            )}
            {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse in={open}>
        <Box
          px="sm"
          pb="sm"
          pt="sm"
          mb="xs"
          style={{
            background: contentBg,
            borderRadius: '0 0 8px 8px',
            border: `1px solid ${borderColor}`,
            borderTop: 'none',
          }}
        >
          {isLoading ? (
            <Center py="md">
              <Loader size="xs" />
            </Center>
          ) : !review ? (
            <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" p="xs" mt="xs">
              <Text size="xs">No review available for this cycle yet.</Text>
            </Alert>
          ) : review.status !== 'published' ? (
            <Alert
              icon={<IconAlertCircle size={14} />}
              color="yellow"
              variant="light"
              p="xs"
              mt="xs"
            >
              <Text size="xs" fw={500}>
                Review in progress
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Your manager is working on your review. You'll be notified once it's published.
              </Text>
            </Alert>
          ) : (
            <Stack gap="sm" mt="xs">
              {/* Attendance summary */}
              <Group gap="xl">
                <Box ta="center">
                  <Text size="xs" c="dimmed">
                    Present
                  </Text>
                  <Text size="sm" fw={700} c="blue">
                    {review.attendance_days ?? '—'}
                  </Text>
                </Box>
                <Box ta="center">
                  <Text size="xs" c="dimmed">
                    Late
                  </Text>
                  <Text size="sm" fw={700} c="orange">
                    {review.late_count ?? '—'}
                  </Text>
                </Box>
                <Box ta="center">
                  <Text size="xs" c="dimmed">
                    Absent
                  </Text>
                  <Text size="sm" fw={700} c="red">
                    {review.absent_count ?? '—'}
                  </Text>
                </Box>
                <Box ta="center">
                  <Text size="xs" c="dimmed">
                    OT (hrs)
                  </Text>
                  <Text size="sm" fw={700} c="teal">
                    {((review.overtime_minutes ?? 0) / 60).toFixed(1)}
                  </Text>
                </Box>
              </Group>

              {/* Criteria notes */}
              {review.score_details && review.score_details.some((d) => d.note) && (
                <Stack gap={4}>
                  <Group gap="xs">
                    <IconChecks size={13} color="var(--mantine-color-dimmed)" />
                    <Text
                      size="xs"
                      fw={600}
                      c="dimmed"
                      tt="uppercase"
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Criteria Notes
                    </Text>
                  </Group>
                  {review.score_details
                    .filter((d) => d.note)
                    .map((detail) => (
                      <Box
                        key={detail.id}
                        px="sm"
                        py={6}
                        style={{
                          background: innerItemBg,
                          borderRadius: 6,
                          border: `1px solid ${innerItemBorder}`,
                        }}
                      >
                        <Text size="xs" fw={500} mb={2}>
                          {detail.criteria_name}
                        </Text>
                        <Text size="xs" c="dimmed" fs="italic">
                          "{detail.note}"
                        </Text>
                      </Box>
                    ))}
                </Stack>
              )}

              {/* Achievements */}
              {review.achievements && (
                <Box
                  px="sm"
                  py="xs"
                  style={{
                    background: yellowBg,
                    borderRadius: 6,
                    border: `1px solid ${yellowBorder}`,
                  }}
                >
                  <Group gap="xs" mb={4}>
                    <IconTrophy size={13} color="var(--mantine-color-yellow-7)" />
                    <Text size="xs" fw={600} c="yellow.7">
                      Key Achievements
                    </Text>
                  </Group>
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {review.achievements}
                  </Text>
                </Box>
              )}

              {/* Manager feedback */}
              {review.comment && (
                <Box
                  px="sm"
                  py="xs"
                  style={{
                    background: blueBg,
                    borderRadius: 6,
                    border: `1px solid ${blueBorder}`,
                  }}
                >
                  <Group gap="xs" mb={4}>
                    <IconMessageCircle size={13} color="var(--mantine-color-blue-6)" />
                    <Text size="xs" fw={600} c="blue.7">
                      Manager Feedback
                    </Text>
                  </Group>
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {review.comment}
                  </Text>
                </Box>
              )}

              {!hasFeedback && (
                <Text size="xs" c="dimmed" ta="center" py="xs">
                  No feedback provided for this review.
                </Text>
              )}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function MyReviewsPage() {
  const { data: cycles = [], isLoading: cyclesLoading } = useGetCycles();

  const myCycles = (cycles as IReviewCycle[]).filter(
    (c) => new Date(c.announce_date) <= new Date(),
  );

  return (
    <Stack gap="md">
      <PageHeader
        title="My Reviews"
        description="Your performance evaluation history and feedback from your manager"
      />

      {cyclesLoading ? (
        <Center h={300}>
          <Loader />
        </Center>
      ) : myCycles.length === 0 ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <ThemeIcon size="xl" variant="light" color="gray" radius="xl">
              <IconStar size={24} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">
              No review cycles available yet
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="sm">
          {myCycles.map((cycle) => (
            <CycleReviewRow key={cycle.id} cycle={cycle} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
