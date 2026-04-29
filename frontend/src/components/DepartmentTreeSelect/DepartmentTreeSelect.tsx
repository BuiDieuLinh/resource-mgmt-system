import { useState } from 'react';
import {
  Popover,
  TextInput,
  ScrollArea,
  Text,
  Group,
  Box,
  ActionIcon,
  UnstyledButton,
  Loader,
} from '@mantine/core';
import {
  IconBuilding,
  IconBriefcase,
  IconChevronRight,
  IconX,
  IconSearch,
} from '@tabler/icons-react';
import { useGetAllDepartments } from '@/modules/departments/api/get-departments';
import { useGetAllPositions } from '@/modules/positions/api/get-positions';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  w?: number | string;
}

function DeptNode({
  dept,
  selected,
  onSelect,
  search,
}: {
  dept: { id: string; department_name: string };
  selected: string | null;
  onSelect: (id: string, name: string) => void;
  search: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: posData } = useGetAllPositions(dept.id);
  const positions = posData?.data ?? [];

  const matchesDept = dept.department_name.toLowerCase().includes(search.toLowerCase());
  const matchingPositions = positions.filter((p) =>
    p.position_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (search && !matchesDept && matchingPositions.length === 0) return null;

  const isSelected = selected === dept.id;

  return (
    <Box>
      <UnstyledButton
        w="100%"
        px="sm"
        py={6}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 6,
          background: isSelected ? 'var(--mantine-color-deepPurple-0)' : 'transparent',
          cursor: 'pointer',
        }}
        onClick={() => onSelect(dept.id, dept.department_name)}
      >
        <ActionIcon
          size={16}
          variant="transparent"
          color="gray"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{ flexShrink: 0 }}
        >
          <IconChevronRight
            size={12}
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '0.15s' }}
          />
        </ActionIcon>
        <IconBuilding
          size={14}
          color="var(--mantine-color-deepPurple-5)"
          style={{ flexShrink: 0 }}
        />
        <Text
          size="sm"
          fw={isSelected ? 600 : 400}
          c={isSelected ? 'deepPurple' : undefined}
          truncate
        >
          {dept.department_name}
        </Text>
      </UnstyledButton>

      {(expanded || (search && matchingPositions.length > 0)) && (
        <Box pl={32}>
          {positions.length === 0 ? (
            <Text size="xs" c="dimmed" px="sm" py={4}>
              No positions
            </Text>
          ) : (
            (search ? matchingPositions : positions).map((pos) => (
              <Box
                key={pos.id}
                px="sm"
                py={4}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <IconBriefcase
                  size={12}
                  color="var(--mantine-color-gray-5)"
                  style={{ flexShrink: 0 }}
                />
                <Text size="xs" c="dimmed" truncate>
                  {pos.position_name}
                </Text>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

export function DepartmentTreeSelect({
  value,
  onChange,
  placeholder = 'Filter department',
  w = 200,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const { data: deptData, isLoading } = useGetAllDepartments();
  const departments = deptData?.data ?? [];

  const selectedDept = departments.find((d) => d.id === value);

  const handleSelect = (id: string, _name: string) => {
    onChange(id === value ? null : id);
    setOpened(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover
      opened={opened}
      onClose={() => {
        setOpened(false);
        setSearch('');
      }}
      position="bottom-start"
      shadow="md"
      width={260}
    >
      <Popover.Target>
        <Box
          style={{
            width: w,
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 6,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--mantine-color-body)',
            minHeight: 36,
          }}
          onClick={() => setOpened((v) => !v)}
        >
          <IconBuilding size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
          <Text size="sm" c={value ? undefined : 'dimmed'} style={{ flex: 1 }} truncate>
            {selectedDept?.department_name ?? placeholder}
          </Text>
          {value && (
            <ActionIcon size={14} variant="transparent" color="gray" onClick={handleClear}>
              <IconX size={12} />
            </ActionIcon>
          )}
        </Box>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Box p="xs" pb={4}>
          <TextInput
            size="xs"
            placeholder="Search..."
            leftSection={<IconSearch size={12} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            autoFocus
          />
        </Box>
        <ScrollArea.Autosize mah={280} p={4}>
          {isLoading ? (
            <Group justify="center" py="sm">
              <Loader size="xs" />
            </Group>
          ) : departments.length === 0 ? (
            <Text size="xs" c="dimmed" ta="center" py="sm">
              No departments
            </Text>
          ) : (
            departments.map((dept) => (
              <DeptNode
                key={dept.id}
                dept={dept}
                selected={value}
                onSelect={handleSelect}
                search={search}
              />
            ))
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
