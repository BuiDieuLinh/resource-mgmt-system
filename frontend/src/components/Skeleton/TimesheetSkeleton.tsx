import { Skeleton, Stack, Group, Grid } from '@mantine/core';

export function TimesheetSkeleton() {
  return (
    <Stack gap="md">
      {/* page header */}
      <Group justify="space-between" align="flex-end">
        <Stack gap={6}>
          <Skeleton h={14} w={120} radius="sm" />
          <Skeleton h={26} w={180} radius="sm" />
          <Skeleton h={12} w={240} radius="sm" />
        </Stack>
        <Skeleton h={34} w={180} radius="sm" />
      </Group>

      <Grid gutter="sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <Grid.Col key={i} span={{ base: 6, sm: 4, md: 2.4 }}>
            <Skeleton h={72} radius="md" />
          </Grid.Col>
        ))}
      </Grid>

      <Group>
        <Skeleton h={34} w={160} radius="sm" />
        <Skeleton h={34} w={180} radius="sm" />
      </Group>

      <Stack gap={6}>
        <Skeleton h={20} radius="sm" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} h={38} radius="sm" />
        ))}
      </Stack>
    </Stack>
  );
}
