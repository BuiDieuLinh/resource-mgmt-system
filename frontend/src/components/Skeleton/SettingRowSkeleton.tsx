import { Skeleton, Group, Stack, Divider } from '@mantine/core';
import { Card } from '@mantine/core';

interface SettingRowSkeletonProps {
  rows?: number;
}

export function SettingRowSkeleton({ rows = 4 }: SettingRowSkeletonProps) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <Group px="md" py="sm" justify="space-between">
            <Group gap="sm">
              <Skeleton circle h={28} w={28} />
              <Stack gap={6}>
                <Skeleton h={12} w={160} radius="sm" />
                <Skeleton h={10} w={220} radius="sm" />
              </Stack>
            </Group>
            <Group gap={6}>
              <Skeleton h={20} w={60} radius="xl" />
              <Skeleton h={24} w={24} radius="sm" />
              <Skeleton h={24} w={24} radius="sm" />
            </Group>
          </Group>
          {i < rows - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
}
