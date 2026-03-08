import React from 'react';
import { Stack, Text, Group } from '@mantine/core';

interface LabelValueProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
}

const LabelValue: React.FC<LabelValueProps> = ({ label, value, icon }) => {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Group gap="xs">
        {icon}
        <Text fw={500}>{value}</Text>
      </Group>
    </Stack>
  );
};

export default LabelValue;
