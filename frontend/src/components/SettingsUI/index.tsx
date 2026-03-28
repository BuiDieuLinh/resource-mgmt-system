import { Group, Text, ThemeIcon, Card, Divider, Box, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

export function SettingRow({
  icon,
  color = 'gray',
  title,
  description,
  right,
  onClick,
  noDivider,
}: {
  icon: React.ReactNode;
  color?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  noDivider?: boolean;
}) {
  const inner = (
    <Group
      justify="space-between"
      align="center"
      py="sm"
      px="md"
      wrap="nowrap"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size="md" radius="sm" style={{ flexShrink: 0 }}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500} lh={1.3}>
            {title}
          </Text>
          {description && (
            <Text size="xs" c="dimmed" lh={1.4}>
              {description}
            </Text>
          )}
        </div>
      </Group>
      <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
        {right}
        {onClick && <IconChevronRight size={14} color="var(--mantine-color-dimmed)" />}
      </Group>
    </Group>
  );
  return (
    <>
      {onClick ? (
        <UnstyledButton w="100%" onClick={onClick}>
          {inner}
        </UnstyledButton>
      ) : (
        <Box>{inner}</Box>
      )}
      {!noDivider && <Divider />}
    </>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      {children}
    </Card>
  );
}

export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" align="center" mb={8}>
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
        {children}
      </Text>
      {action}
    </Group>
  );
}
