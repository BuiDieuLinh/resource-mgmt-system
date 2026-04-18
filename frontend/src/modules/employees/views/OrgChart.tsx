import { useRef, useLayoutEffect, useState, useCallback } from 'react';
import {
  Stack,
  Text,
  Group,
  Avatar,
  Badge,
  Card,
  useMantineColorScheme,
  useMantineTheme,
  HoverCard,
  Divider,
} from '@mantine/core';
import {
  IconUser,
  IconBuilding,
  IconMail,
  IconPhone,
  IconCalendar,
  IconId,
} from '@tabler/icons-react';
import { useGetEmployees } from '../api/get-employees';
import { Loading } from '../../../components/Loading/Loading';
import type { IEmployee } from '../types';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { employeeListUrl } from '@/routes/url';
import { PRIMARY_COLOR } from '@/theme';

interface DepartmentNode {
  id: string;
  name: string;
  employees: IEmployee[];
  manager?: IEmployee;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function midBottom(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y + r.h };
}
function midTop(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y };
}

interface ConnectorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  deptRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  empRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  deptTree: DepartmentNode[];
  stroke: string;
}

function Connectors({
  containerRef,
  rootRef,
  deptRefs,
  empRefs,
  deptTree,
  stroke,
}: ConnectorProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const compute = useCallback(() => {
    const container = containerRef.current;
    const root = rootRef.current;
    if (!container || !root) return;

    const cRect = container.getBoundingClientRect();
    const toLocal = (el: HTMLElement): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - cRect.left, y: r.top - cRect.top, w: r.width, h: r.height };
    };

    const newPaths: string[] = [];
    const rootR = toLocal(root);
    const rb = midBottom(rootR);

    const deptEls = deptTree
      .map((d) => ({ dept: d, el: deptRefs.current[d.id] }))
      .filter((x): x is { dept: DepartmentNode; el: HTMLDivElement } => !!x.el);

    if (deptEls.length === 0) return;

    const deptTops = deptEls.map(({ el }) => midTop(toLocal(el)));
    const railY = deptTops[0].y - 24;

    newPaths.push(`M ${rb.x} ${rb.y} L ${rb.x} ${railY}`);

    const xs = deptTops.map((p) => p.x);
    newPaths.push(`M ${Math.min(...xs)} ${railY} L ${Math.max(...xs)} ${railY}`);

    deptTops.forEach((p) => {
      newPaths.push(`M ${p.x} ${railY} L ${p.x} ${p.y}`);
    });

    deptEls.forEach(({ dept, el }) => {
      const deptR = toLocal(el);
      const db = midBottom(deptR);

      const empEls = dept.employees
        .map((e) => empRefs.current[e.id])
        .filter((x): x is HTMLDivElement => !!x);

      if (empEls.length === 0) return;

      const empTops = empEls.map((e) => midTop(toLocal(e)));
      const empRailY = empTops[0].y - 20;

      newPaths.push(`M ${db.x} ${db.y} L ${db.x} ${empRailY}`);

      const exs = empTops.map((p) => p.x);
      if (empEls.length > 1) {
        newPaths.push(`M ${Math.min(...exs)} ${empRailY} L ${Math.max(...exs)} ${empRailY}`);
      }

      empTops.forEach((p) => {
        newPaths.push(`M ${p.x} ${empRailY} L ${p.x} ${p.y}`);
      });
    });

    setPaths(newPaths);
    setSize({ w: cRect.width, h: cRect.height });
  }, [containerRef, rootRef, deptRefs, empRefs, deptTree]);

  useLayoutEffect(() => {
    const id = setTimeout(compute, 50);
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      clearTimeout(id);
      ro.disconnect();
    };
  }, [compute]);

  if (!paths.length) return null;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      width={size.w}
      height={size.h}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export default function OrgChartPage() {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const theme = useMantineTheme();

  const { data: employeesData, isLoading } = useGetEmployees({ pageIndex: 1, pageSize: 1000 });
  const employees = employeesData?.data || [];

  const deptMap = new Map<string, DepartmentNode>();
  for (const emp of employees) {
    const dept = emp.position?.department;
    if (!dept) continue;
    if (!deptMap.has(dept.id))
      deptMap.set(dept.id, { id: dept.id, name: dept.department_name, employees: [] });
    deptMap.get(dept.id)!.employees.push(emp);
  }
  for (const node of deptMap.values()) {
    node.manager = node.employees.find((e) => e.position?.level === 'manager');
  }
  const deptTree = Array.from(deptMap.values());

  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const deptRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const empRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const strokeColor = dark ? theme.colors.dark[3] : theme.colors.gray[4];

  if (isLoading) return <Loading />;

  return (
    <Stack gap="lg">
      {/* header */}
      <PageHeader
        breadcrumbs={[{ label: 'Employees', path: employeeListUrl }, { label: 'Org Chart' }]}
        title="Organization Chart"
        description="Company organizational structure by department"
        right={
          <Group gap="sm">
            <Badge size="lg" variant="outline" color={dark ? 'violet.4' : PRIMARY_COLOR}>
              {deptTree.length} Departments
            </Badge>
            <Badge size="lg" variant="outline" color="green">
              {employees.length} Employees
            </Badge>
          </Group>
        }
      />

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'visible',
          padding: '32px 24px 40px',
          background: dark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)',
          borderRadius: 16,
          border: `1px solid ${dark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
        }}
      >
        <Connectors
          containerRef={containerRef}
          rootRef={rootRef}
          deptRefs={deptRefs}
          empRefs={empRefs}
          deptTree={deptTree}
          stroke={strokeColor}
        />

        <Stack align="center" gap={0} style={{ minWidth: 'fit-content' }}>
          <div ref={rootRef} style={{ marginBottom: 48 }}>
            <Card
              withBorder
              radius="md"
              px="lg"
              py="sm"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.deepPurple?.[7] ?? '#4a148c'}, ${theme.colors.deepPurple?.[5] ?? '#7b1fa2'})`,
                border: 'none',
                boxShadow: '0 4px 16px rgba(74,20,140,0.3)',
                minWidth: 200,
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <Avatar size={40} radius="md" color="white" variant="transparent">
                  <IconBuilding size={22} color="white" />
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700} size="md" c="white">
                    RMS Core
                  </Text>
                  <Text size="xs" c="rgba(255,255,255,0.7)">
                    Organization
                  </Text>
                </Stack>
              </Group>
            </Card>
          </div>

          <Group align="flex-start" gap={32} wrap="nowrap" style={{ justifyContent: 'center' }}>
            {deptTree.map((dept) => (
              <Stack key={dept.id} align="center" gap={0}>
                {/* dept card */}
                <div
                  ref={(el) => {
                    deptRefs.current[dept.id] = el;
                  }}
                  style={{ marginBottom: 40 }}
                >
                  <Card
                    withBorder
                    radius="md"
                    px="md"
                    py="sm"
                    style={{
                      minWidth: 180,
                      maxWidth: 220,
                      background: dark ? 'var(--mantine-color-dark-6)' : 'white',
                      borderColor: dark
                        ? 'var(--mantine-color-dark-4)'
                        : 'var(--mantine-color-blue-2)',
                      boxShadow: dark
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : '0 2px 8px rgba(33,150,243,0.08)',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      cursor: 'default',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Avatar size={32} radius="sm" color="blue" variant="light">
                        <IconBuilding size={16} />
                      </Avatar>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="sm" lineClamp={1}>
                          {dept.name}
                        </Text>
                        <Group gap={4} wrap="nowrap">
                          <Badge size="xs" variant="light" color="blue" radius="sm">
                            {dept.employees.length} members
                          </Badge>
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                </div>

                {dept.employees.length > 0 && (
                  <Group align="flex-start" gap={12} wrap="nowrap">
                    {dept.employees.map((emp) => {
                      const isManager = emp.position?.level === 'manager';
                      return (
                        <HoverCard
                          key={emp.id}
                          width={260}
                          position="bottom"
                          withArrow
                          shadow="md"
                          openDelay={100}
                          closeDelay={100}
                        >
                          <HoverCard.Target>
                            <div
                              ref={(el) => {
                                empRefs.current[emp.id] = el;
                              }}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => {
                                const card = e.currentTarget.querySelector(
                                  '.emp-card',
                                ) as HTMLElement;
                                if (card) {
                                  card.style.transform = 'translateY(-3px)';
                                  card.style.boxShadow = isManager
                                    ? '0 6px 16px rgba(74,20,140,0.28)'
                                    : dark
                                      ? '0 4px 12px rgba(0,0,0,0.4)'
                                      : '0 4px 12px rgba(0,0,0,0.12)';
                                  card.style.borderColor = isManager
                                    ? 'var(--mantine-color-deepPurple-4)'
                                    : dark
                                      ? 'var(--mantine-color-dark-2)'
                                      : 'var(--mantine-color-gray-4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                const card = e.currentTarget.querySelector(
                                  '.emp-card',
                                ) as HTMLElement;
                                if (card) {
                                  card.style.transform = '';
                                  card.style.boxShadow = '';
                                  card.style.borderColor = '';
                                }
                              }}
                            >
                              <Card
                                className="emp-card"
                                withBorder
                                radius="md"
                                px="sm"
                                py="xs"
                                style={{
                                  minWidth: 140,
                                  maxWidth: 168,
                                  background: dark ? 'var(--mantine-color-dark-6)' : 'white',
                                  borderColor: isManager
                                    ? dark
                                      ? 'var(--mantine-color-deepPurple-5)'
                                      : 'var(--mantine-color-deepPurple-3)'
                                    : dark
                                      ? 'var(--mantine-color-dark-4)'
                                      : 'var(--mantine-color-gray-2)',
                                  boxShadow: isManager
                                    ? '0 2px 10px rgba(74,20,140,0.2)'
                                    : dark
                                      ? '0 1px 4px rgba(0,0,0,0.25)'
                                      : '0 1px 4px rgba(0,0,0,0.06)',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  transition:
                                    'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: isManager
                                      ? `linear-gradient(90deg, ${theme.colors.deepPurple?.[6] ?? '#4a148c'}, ${theme.colors.deepPurple?.[4] ?? '#9c27b0'})`
                                      : 'transparent',
                                  }}
                                />
                                <Group gap="xs" wrap="nowrap" mt={isManager ? 4 : 0}>
                                  <Avatar
                                    src={emp.avatar_url}
                                    size={28}
                                    radius="xl"
                                    color={PRIMARY_COLOR}
                                  >
                                    <IconUser size={14} />
                                  </Avatar>
                                  <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap={4} wrap="nowrap">
                                      <Text fw={600} size="xs" lineClamp={1}>
                                        {emp.full_name}
                                      </Text>
                                      {isManager && (
                                        <Badge
                                          size="xs"
                                          color={PRIMARY_COLOR}
                                          variant="filled"
                                          radius="sm"
                                          px={4}
                                        >
                                          MGR
                                        </Badge>
                                      )}
                                    </Group>
                                    <Text size="10px" c="dimmed" lineClamp={1}>
                                      {emp.position?.position_name || '—'}
                                    </Text>
                                  </Stack>
                                  <div
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      background:
                                        emp.status === 'active'
                                          ? 'var(--mantine-color-green-5)'
                                          : 'var(--mantine-color-gray-5)',
                                    }}
                                  />
                                </Group>
                              </Card>
                            </div>
                          </HoverCard.Target>

                          <HoverCard.Dropdown p="md">
                            <Stack gap="sm">
                              <Group gap="sm" wrap="nowrap">
                                <Avatar
                                  src={emp.avatar_url}
                                  size={44}
                                  radius="xl"
                                  color={PRIMARY_COLOR}
                                >
                                  <IconUser size={20} />
                                </Avatar>
                                <Stack gap={2}>
                                  <Group gap={6} wrap="nowrap">
                                    <Text fw={700} size="sm">
                                      {emp.full_name}
                                    </Text>
                                    {isManager && (
                                      <Badge
                                        size="xs"
                                        color={PRIMARY_COLOR}
                                        variant="filled"
                                        radius="sm"
                                      >
                                        MGR
                                      </Badge>
                                    )}
                                  </Group>
                                  {emp.display_name && (
                                    <Text size="xs" c="dimmed">
                                      {emp.display_name}
                                    </Text>
                                  )}
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={emp.status === 'active' ? 'green' : 'gray'}
                                    radius="sm"
                                  >
                                    {emp.status}
                                  </Badge>
                                </Stack>
                              </Group>

                              <Divider />

                              <Stack gap={6}>
                                <Group gap={6} wrap="nowrap">
                                  <IconId
                                    size={13}
                                    color="var(--mantine-color-dimmed)"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Text size="xs" c="dimmed" w={60}>
                                    Code
                                  </Text>
                                  <Text size="xs" fw={500}>
                                    {emp.employee_code}
                                  </Text>
                                </Group>
                                <Group gap={6} wrap="nowrap">
                                  <IconBuilding
                                    size={13}
                                    color="var(--mantine-color-dimmed)"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Text size="xs" c="dimmed" w={60}>
                                    Position
                                  </Text>
                                  <Text size="xs" fw={500} lineClamp={2}>
                                    {emp.position?.position_name}
                                  </Text>
                                </Group>
                                <Group gap={6} wrap="nowrap">
                                  <IconMail
                                    size={13}
                                    color="var(--mantine-color-dimmed)"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Text size="xs" c="dimmed" w={60}>
                                    Email
                                  </Text>
                                  <Text size="xs" fw={500} lineClamp={1}>
                                    {emp.email}
                                  </Text>
                                </Group>
                                {emp.phone && (
                                  <Group gap={6} wrap="nowrap">
                                    <IconPhone
                                      size={13}
                                      color="var(--mantine-color-dimmed)"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <Text size="xs" c="dimmed" w={60}>
                                      Phone
                                    </Text>
                                    <Text size="xs" fw={500}>
                                      {emp.phone}
                                    </Text>
                                  </Group>
                                )}
                                <Group gap={6} wrap="nowrap">
                                  <IconCalendar
                                    size={13}
                                    color="var(--mantine-color-dimmed)"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <Text size="xs" c="dimmed" w={60}>
                                    Hired
                                  </Text>
                                  <Text size="xs" fw={500}>
                                    {new Date(emp.hire_date).toLocaleDateString('vi-VN')}
                                  </Text>
                                </Group>
                              </Stack>
                            </Stack>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      );
                    })}
                  </Group>
                )}
              </Stack>
            ))}
          </Group>
        </Stack>
      </div>
    </Stack>
  );
}
