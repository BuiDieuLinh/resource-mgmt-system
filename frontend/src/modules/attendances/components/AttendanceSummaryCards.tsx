import { Grid, Card, Text } from '@mantine/core';
import type { IAttendanceSummary } from '../types';
import { useTranslation } from 'react-i18next';

interface Props {
  summary: IAttendanceSummary;
}

const CARDS = [
  { key: 'plan_day', labelKey: 'attendance.summary.plannedDays', color: 'blue' },
  { key: 'actual_day', labelKey: 'attendance.summary.actualDays', color: 'green' },
  { key: 'late', labelKey: 'attendance.summary.late', color: 'orange' },
  { key: 'absent', labelKey: 'attendance.summary.absent', color: 'red' },
  { key: 'over_time', labelKey: 'attendance.summary.overtimeHours', color: 'violet' },
] as const;

export function AttendanceSummaryCards({ summary }: Props) {
  const { t } = useTranslation();
  return (
    <Grid gutter="sm">
      {CARDS.map(({ key, labelKey, color }) => (
        <Grid.Col key={key} span={{ base: 6, sm: 4, md: 2.4 }}>
          <Card withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">
              {t(labelKey)}
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
