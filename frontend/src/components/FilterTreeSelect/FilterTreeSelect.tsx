import { useState, type MouseEvent } from 'react';
import {
  Box,
  Popover,
  TextInput,
  ScrollArea,
  Stack,
  Group,
  Text,
  UnstyledButton,
  Loader,
  ActionIcon,
  Checkbox,
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconChevronRight,
  IconShieldCheck,
  IconBuilding,
  IconUser,
} from '@tabler/icons-react';

export type CombinedFilterItem = {
  type: 'employee' | 'department' | 'status';
  value: string;
  label: string;
};

interface FilterTreeSelectProps {
  value: CombinedFilterItem[];
  onChange: (next: CombinedFilterItem[]) => void;
  placeholder?: string;
  w?: number | string;
  employeeOptions: { value: string; label: string }[];
  departments: { id: string; department_name: string }[];
  statusOptions: { value: string; label: string }[];
  isLoading?: boolean;
}

export function FilterTreeSelect({
  value,
  onChange,
  placeholder = 'Filter by employee, department or status',
  w = 260,
  employeeOptions,
  departments,
  statusOptions,
  isLoading,
}: FilterTreeSelectProps) {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ status: true, department: true, employee: true });

  const term = search.trim().toLowerCase();
  const statusItems = statusOptions.filter(
    (item) => item.label.toLowerCase().includes(term) || item.value.toLowerCase().includes(term),
  );
  const deptItems = departments.filter((dept) => dept.department_name.toLowerCase().includes(term));
  const employeeItems = employeeOptions.filter((emp) => emp.label.toLowerCase().includes(term));

  const selectedKeys = new Set(value.map((item) => `${item.type}:${item.value}`));

  const handleToggle = (type: CombinedFilterItem['type'], valueKey: string, label: string) => {
    const key = `${type}:${valueKey}`;
    const next = selectedKeys.has(key)
      ? value.filter((item) => `${item.type}:${item.value}` !== key)
      : [...value, { type, value: valueKey, label }];
    onChange(next);
  };

  const handleClear = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange([]);
    setSearch('');
  };

  const selectedLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0].label
        : `${value.length} filters selected`;

  return (
    <Popover
      opened={opened}
      onClose={() => {
        setOpened(false);
        setSearch('');
      }}
      position="bottom-start"
      shadow="md"
      width={340}
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
          <IconSearch size={14} color="var(--mantine-color-dimmed)" />
          <Text size="sm" c={selectedLabel ? undefined : 'dimmed'} style={{ flex: 1 }} truncate>
            {selectedLabel ?? placeholder}
          </Text>
          {value.length > 0 && (
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
        <ScrollArea.Autosize mah={380} p={8}>
          {isLoading ? (
            <Group justify="center" py="sm">
              <Loader size="xs" />
            </Group>
          ) : (
            <Stack gap={12}>
              {statusItems.length > 0 && (
                <Box>
                  <UnstyledButton
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--mantine-color-gray-0)',
                      marginBottom: 8,
                    }}
                    onClick={() => setExpanded((prev) => ({ ...prev, status: !prev.status }))}
                  >
                    <Group gap={8}>
                      <IconShieldCheck
                        size={16}
                        style={{ color: 'var(--mantine-color-indigo-6)' }}
                      />
                      <Text size="sm" fw={600}>
                        Status
                      </Text>
                    </Group>
                    <IconChevronRight
                      size={14}
                      style={{
                        transform: expanded.status ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                      }}
                    />
                  </UnstyledButton>
                  {expanded.status && (
                    <Stack gap={6} pl={24}>
                      {statusItems.map((item) => (
                        <Group
                          key={item.value}
                          gap={8}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 4,
                            background: selectedKeys.has(`status:${item.value}`)
                              ? 'var(--mantine-color-deepPurple-0)'
                              : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleToggle('status', item.value, `Status: ${item.label}`)
                          }
                        >
                          <Checkbox
                            checked={selectedKeys.has(`status:${item.value}`)}
                            readOnly
                            size="sm"
                          />
                          <Text size="sm" style={{ flex: 1 }}>
                            {item.label}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {deptItems.length > 0 && (
                <Box>
                  <UnstyledButton
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--mantine-color-gray-0)',
                      marginBottom: 8,
                    }}
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, department: !prev.department }))
                    }
                  >
                    <Group gap={8}>
                      <IconBuilding size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                      <Text size="sm" fw={600}>
                        Department
                      </Text>
                    </Group>
                    <IconChevronRight
                      size={14}
                      style={{
                        transform: expanded.department ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                      }}
                    />
                  </UnstyledButton>
                  {expanded.department && (
                    <Stack gap={6} pl={24}>
                      {deptItems.map((dept) => (
                        <Group
                          key={dept.id}
                          gap={8}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 4,
                            background: selectedKeys.has(`department:${dept.id}`)
                              ? 'var(--mantine-color-deepPurple-0)'
                              : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleToggle(
                              'department',
                              dept.id,
                              `Department: ${dept.department_name}`,
                            )
                          }
                        >
                          <Checkbox
                            checked={selectedKeys.has(`department:${dept.id}`)}
                            readOnly
                            size="sm"
                          />
                          <Text size="sm" style={{ flex: 1 }}>
                            {dept.department_name}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {employeeItems.length > 0 && (
                <Box>
                  <UnstyledButton
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--mantine-color-gray-0)',
                      marginBottom: 8,
                    }}
                    onClick={() => setExpanded((prev) => ({ ...prev, employee: !prev.employee }))}
                  >
                    <Group gap={8}>
                      <IconUser size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
                      <Text size="sm" fw={600}>
                        Employee
                      </Text>
                    </Group>
                    <IconChevronRight
                      size={14}
                      style={{
                        transform: expanded.employee ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                      }}
                    />
                  </UnstyledButton>
                  {expanded.employee && (
                    <Stack gap={6} pl={24}>
                      {employeeItems.map((emp) => (
                        <Group
                          key={emp.value}
                          gap={8}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 4,
                            background: selectedKeys.has(`employee:${emp.value}`)
                              ? 'var(--mantine-color-deepPurple-0)'
                              : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleToggle('employee', emp.value, `Employee: ${emp.label}`)
                          }
                        >
                          <Checkbox
                            checked={selectedKeys.has(`employee:${emp.value}`)}
                            readOnly
                            size="sm"
                          />
                          <Text size="sm" style={{ flex: 1 }}>
                            {emp.label}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {!isLoading &&
                statusItems.length === 0 &&
                deptItems.length === 0 &&
                employeeItems.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" py="sm">
                    No matching items
                  </Text>
                )}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
