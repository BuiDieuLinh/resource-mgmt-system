import { Skeleton, Group, Stack } from '@mantine/core';

export function OrgChartSkeleton() {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={6}>
          <Skeleton h={14} w={120} radius="sm" />
          <Skeleton h={24} w={220} radius="sm" />
          <Skeleton h={12} w={280} radius="sm" />
        </Stack>
        <Group gap="sm">
          <Skeleton h={26} w={130} radius="xl" />
          <Skeleton h={26} w={120} radius="xl" />
        </Group>
      </Group>

      <Skeleton h={16} radius="sm" />
      <Stack
        align="center"
        gap={40}
        p="xl"
        style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 16 }}
      >
        <Skeleton h={60} w={200} radius="md" />

        <Group gap={32} justify="center" wrap="nowrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <Stack key={i} align="center" gap={32}>
              <Skeleton h={64} w={200} radius="md" />
              <Group gap={12} wrap="nowrap">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} h={52} w={148} radius="md" />
                ))}
              </Group>
            </Stack>
          ))}
        </Group>
      </Stack>
    </Stack>
  );
}
