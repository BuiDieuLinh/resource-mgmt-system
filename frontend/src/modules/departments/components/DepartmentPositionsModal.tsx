import { Modal, Group, ThemeIcon, Text, Badge, Stack, Box, Divider } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconBriefcase } from '@tabler/icons-react';
import type { IDepartment, IDepartmentPosition } from '../types';
import { LEVEL_LABEL, LEVEL_COLOR, type LevelPosition } from '@/constant';

interface Props {
  department: IDepartment | null;
  onClose: () => void;
}

export function DepartmentPositionsModal({ department, onClose }: Props) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const positions = department?.positions ?? [];

  const rowEven = isDark ? '#1a1b1e' : '#ffffff';
  const rowOdd = isDark ? '#25262b' : '#f1f3f5';
  const rowBorder = isDark ? '#373a40' : '#e9ecef';
  const listBorder = isDark ? '#373a40' : '#dee2e6';

  const infoBg = isDark ? 'rgba(51, 65, 120, 0.25)' : 'rgba(224, 231, 255, 0.3)';
  const infoBorder = isDark ? '#3b4a8a' : '#dbe4ff';

  return (
    <Modal
      opened={!!department}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="blue" radius="sm">
            <IconBriefcase size={14} />
          </ThemeIcon>
          <Text fw={600} size="sm">
            {department?.department_name}
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {positions.length} positions
          </Badge>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        {/* Department info */}
        <Group
          gap="md"
          wrap="nowrap"
          align="flex-start"
          p="sm"
          style={{
            borderRadius: 8,
            border: `1px solid ${infoBorder}`,
            background: infoBg,
          }}
        >
          <Box style={{ flex: 2 }}>
            <Text size="xs" c="dimmed" mb={2}>
              Name
            </Text>
            <Text size="sm" fw={600}>
              {department?.department_name}{' '}
              <Text span size="xs" c="dimmed" ff="monospace">
                ({department?.department_code})
              </Text>
            </Text>
          </Box>
          {department?.description && (
            <>
              <Divider orientation="vertical" />
              <Box style={{ flex: 3 }}>
                <Text size="xs" c="dimmed" mb={2}>
                  Description
                </Text>
                <Text size="sm">{department.description}</Text>
              </Box>
            </>
          )}
        </Group>

        <Divider label="Positions" labelPosition="left" />

        {positions.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No positions in this department
          </Text>
        ) : (
          <Box
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              border: `1px solid ${listBorder}`,
            }}
          >
            {positions.map((pos: IDepartmentPosition, i: number) => (
              <Group
                key={pos.id}
                justify="space-between"
                align="center"
                py={10}
                px="sm"
                style={{
                  background: i % 2 === 0 ? rowEven : rowOdd,
                  borderBottom: i < positions.length - 1 ? `1px solid ${rowBorder}` : 'none',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Text size="xs" c="dimmed" w={18} ta="right" style={{ flexShrink: 0 }}>
                    {i + 1}.
                  </Text>
                  <Box>
                    <Text size="sm" fw={500} lh={1.3}>
                      {pos.position_name}
                    </Text>
                    {pos.description && (
                      <Text size="xs" c="dimmed" lh={1.4}>
                        {pos.description}
                      </Text>
                    )}
                  </Box>
                </Group>
                <Badge
                  size="sm"
                  variant="light"
                  color={LEVEL_COLOR[pos.level as LevelPosition] ?? 'gray'}
                  style={{ flexShrink: 0 }}
                >
                  {LEVEL_LABEL[pos.level as LevelPosition] ?? pos.level}
                </Badge>
              </Group>
            ))}
          </Box>
        )}
      </Stack>
    </Modal>
  );
}
