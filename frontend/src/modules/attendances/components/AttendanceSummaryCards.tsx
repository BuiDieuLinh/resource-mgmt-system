import { Grid, Card, Text } from '@mantine/core';
import type { IAttendanceSummary } from '../types';

interface Props {
  summary: IAttendanceSummary;
}

const CARDS = [
  { key: 'plan_day', label: 'Planned Days', color: 'blue' },
  { key: 'actual_day', label: 'Actual Days', color: 'green' },
  { key: 'late', label: 'Late', color: 'orange' },
  { key: 'absent', label: 'Absent', color: 'red' },
  { key: 'over_time', label: 'Overtime (h)', color: 'violet' },
] as const;

export function AttendanceSummaryCards({ summary }: Props) {
  return (
    <Grid gutter="sm">
      {CARDS.map(({ key, label, color }) => (
        <Grid.Col key={key} span={{ base: 6, sm: 4, md: 2.4 }}>
          <Card withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">
              {label}
            </Text>
            <Text fw={700} size="xl" c={color}>
              {summary[key]}
            </Text>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}
