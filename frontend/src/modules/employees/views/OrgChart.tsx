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
import { OrgChartSkeleton } from '@/components/Skeleton/OrgChartSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { IEmployee } from '../types';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { employeeListUrl } from '@/routes/url';
import { PRIMARY_COLOR } from '@/theme';
import { useTranslation } from 'react-i18next';

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

interface ConnectorPath {
  d: string;
  kind: 'structure' | 'manager';
}

interface ManagerGroup {
  manager: IEmployee;
  employees: IEmployee[];
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
  managerStroke: string;
}

function Connectors({
  containerRef,
  rootRef,
  deptRefs,
  empRefs,
  deptTree,
  stroke,
  managerStroke,
}: ConnectorProps) {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
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

    const newPaths: ConnectorPath[] = [];
    const pushStructure = (d: string) => newPaths.push({ d, kind: 'structure' });
    const pushManager = (d: string) => newPaths.push({ d, kind: 'manager' });
    const rootR = toLocal(root);
    const rb = midBottom(rootR);

    const deptEls = deptTree
      .map((d) => ({ dept: d, el: deptRefs.current[d.id] }))
      .filter((x): x is { dept: DepartmentNode; el: HTMLDivElement } => !!x.el);

    if (deptEls.length === 0) return;

    const deptTops = deptEls.map(({ el }) => midTop(toLocal(el)));
    const railY = deptTops[0].y - 24;

    pushStructure(`M ${rb.x} ${rb.y} L ${rb.x} ${railY}`);

    const xs = deptTops.map((p) => p.x);
    pushStructure(`M ${Math.min(...xs)} ${railY} L ${Math.max(...xs)} ${railY}`);

    deptTops.forEach((p) => {
      pushStructure(`M ${p.x} ${railY} L ${p.x} ${p.y}`);
    });

    deptEls.forEach(({ dept, el }) => {
      const deptR = toLocal(el);
      const db = midBottom(deptR);

      const employeeIds = new Set(dept.employees.map((e) => e.id));
      const managedIds = new Set(
        dept.employees
          .filter((e) => e.manager_id && e.manager_id !== e.id && empRefs.current[e.manager_id])
          .map((e) => e.id),
      );
      const managerIds = new Set(
        dept.employees
          .map((e) => e.manager_id)
          .filter((id): id is string => !!id && !!empRefs.current[id]),
      );
      const topEmployeeIds = [
        ...managerIds,
        ...dept.employees
          .filter((e) => !managedIds.has(e.id) && !managerIds.has(e.id) && employeeIds.has(e.id))
          .map((e) => e.id),
      ];

      const empEls = topEmployeeIds
        .map((id) => empRefs.current[id])
        .filter((x): x is HTMLDivElement => !!x);

      if (empEls.length === 0) return;

      const empTops = empEls.map((e) => midTop(toLocal(e)));
      const empRailY = empTops[0].y - 20;

      pushStructure(`M ${db.x} ${db.y} L ${db.x} ${empRailY}`);

      const exs = empTops.map((p) => p.x);
      if (empEls.length > 1) {
        pushStructure(`M ${Math.min(...exs)} ${empRailY} L ${Math.max(...exs)} ${empRailY}`);
      }

      empTops.forEach((p) => {
        pushStructure(`M ${p.x} ${empRailY} L ${p.x} ${p.y}`);
      });
    });

    deptTree.forEach((dept) => {
      dept.employees.forEach((emp) => {
        if (!emp.manager_id || emp.manager_id === emp.id) return;

        const managerEl = empRefs.current[emp.manager_id];
        const employeeEl = empRefs.current[emp.id];
        if (!managerEl || !employeeEl) return;

        const managerBottom = midBottom(toLocal(managerEl));
        const employeeTop = midTop(toLocal(employeeEl));
        const railY =
          employeeTop.y > managerBottom.y + 24
            ? managerBottom.y + Math.max(18, (employeeTop.y - managerBottom.y) / 2)
            : Math.max(managerBottom.y, employeeTop.y) + 24;

        pushManager(
          `M ${managerBottom.x} ${managerBottom.y} L ${managerBottom.x} ${railY} L ${employeeTop.x} ${railY} L ${employeeTop.x} ${employeeTop.y}`,
        );
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
      {paths.map((path, i) => (
        <path
          key={i}
          d={path.d}
          stroke={path.kind === 'manager' ? managerStroke : stroke}
          strokeWidth={path.kind === 'manager' ? 2 : 1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export default function OrgChartPage() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const theme = useMantineTheme();

  const { data: employeesData, isLoading: _loading } = useGetEmployees({
    pageIndex: 1,
  });
  const isLoading = useDelayedLoading(_loading);
  const employees = employeesData?.data || [];
  const employeeById = new Map(employees.map((emp) => [emp.id, emp]));

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
  const managerStrokeColor = dark
    ? (theme.colors.deepPurple?.[3] ?? '#ce93d8')
    : (theme.colors.deepPurple?.[6] ?? '#6a1b9a');

  if (isLoading) return <OrgChartSkeleton />;

  const getDepartmentHierarchy = (dept: DepartmentNode) => {
    const groupsByManager = new Map<string, IEmployee[]>();

    dept.employees.forEach((emp) => {
      if (!emp.manager_id || emp.manager_id === emp.id || !employeeById.has(emp.manager_id)) return;

      const group = groupsByManager.get(emp.manager_id) ?? [];
      group.push(emp);
      groupsByManager.set(emp.manager_id, group);
    });

    const managerGroups: ManagerGroup[] = Array.from(groupsByManager.entries()).map(
      ([managerId, groupEmployees]) => ({
        manager: employeeById.get(managerId)!,
        employees: groupEmployees,
      }),
    );
    const managedIds = new Set(
      managerGroups.flatMap((group) => group.employees.map((emp) => emp.id)),
    );
    const managerIds = new Set(managerGroups.map((group) => group.manager.id));
    const standaloneEmployees = dept.employees.filter(
      (emp) => !managedIds.has(emp.id) && !managerIds.has(emp.id),
    );

    return { managerGroups, standaloneEmployees };
  };

  const renderEmployeeCard = (emp: IEmployee, forceManager = false) => {
    const isManager = forceManager || emp.position?.level === 'manager';

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
              const card = e.currentTarget.querySelector('.emp-card') as HTMLElement;
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
              const card = e.currentTarget.querySelector('.emp-card') as HTMLElement;
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
                transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
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
                <Avatar src={emp.avatar_url} size={28} radius="xl" color={PRIMARY_COLOR}>
                  <IconUser size={16} />
                </Avatar>
                <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={4} wrap="nowrap">
                    <Text fw={600} size="xs" lineClamp={1}>
                      {emp.full_name}
                    </Text>
                    {isManager && (
                      <Badge size="xs" color={PRIMARY_COLOR} variant="filled" radius="sm" px={4}>
                        {t('employee.managerShort')}
                      </Badge>
                    )}
                  </Group>
                  <Text size="10px" c="dimmed" lineClamp={1}>
                    {emp.position?.position_name || t('common.notAvailable')}
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
              <Avatar src={emp.avatar_url} size={44} radius="xl" color={PRIMARY_COLOR}>
                <IconUser size={22} />
              </Avatar>
              <Stack gap={2}>
                <Group gap={6} wrap="nowrap">
                  <Text fw={700} size="sm">
                    {emp.full_name}
                  </Text>
                  {isManager && (
                    <Badge size="xs" color={PRIMARY_COLOR} variant="filled" radius="sm">
                      {t('employee.managerShort')}
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
                  {emp.status === 'active'
                    ? t('employee.activeEmployee')
                    : t('employee.inactiveEmployee')}
                </Badge>
              </Stack>
            </Group>

            <Divider />

            <Stack gap={6}>
              <Group gap={6} wrap="nowrap">
                <IconId size={13} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                <Text size="xs" c="dimmed" w={60}>
                  {t('importPreview.code')}
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
                  {t('employee.position')}
                </Text>
                <Text size="xs" fw={500} lineClamp={2}>
                  {emp.position?.position_name}
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap">
                <IconMail size={13} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                <Text size="xs" c="dimmed" w={60}>
                  {t('employee.email')}
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
                    {t('employee.phone')}
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
                  {t('employee.hireDate')}
                </Text>
                <Text size="xs" fw={500}>
                  {new Date(emp.hire_date).toLocaleDateString(
                    i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN',
                  )}
                </Text>
              </Group>
            </Stack>
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    );
  };

  return (
    <Stack gap="lg">
      {/* header */}
      <PageHeader
        breadcrumbs={[
          { label: t('nav.employeeList'), path: employeeListUrl },
          { label: t('employee.orgChart') },
        ]}
        title={t('employee.orgChart')}
        description={t('employee.orgChartDescription')}
        right={
          <Group gap="sm">
            <Badge size="lg" variant="outline" color={dark ? 'violet.4' : PRIMARY_COLOR}>
              {t('employee.orgChartDepartments', { count: deptTree.length })}
            </Badge>
            <Badge size="lg" variant="outline" color="green">
              {t('employee.orgChartEmployees', { count: employees.length })}
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
          managerStroke={managerStrokeColor}
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
                  <IconBuilding size={24} color="white" />
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700} size="md" c="white">
                    RMS Core
                  </Text>
                  <Text size="xs" c="rgba(255,255,255,0.7)">
                    {t('employee.organization')}
                  </Text>
                </Stack>
              </Group>
            </Card>
          </div>

          <Group align="flex-start" gap={32} wrap="nowrap" style={{ justifyContent: 'center' }}>
            {deptTree.map((dept) => {
              const { managerGroups, standaloneEmployees } = getDepartmentHierarchy(dept);

              return (
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
                          <IconBuilding size={18} />
                        </Avatar>
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={700} size="sm" lineClamp={1}>
                            {dept.name}
                          </Text>
                          <Group gap={4} wrap="nowrap">
                            <Badge size="xs" variant="light" color="blue" radius="sm">
                              {t('employee.orgChartMembers', { count: dept.employees.length })}
                            </Badge>
                          </Group>
                        </Stack>
                      </Group>
                    </Card>
                  </div>

                  {dept.employees.length > 0 && (
                    <Group align="flex-start" gap={28} wrap="nowrap">
                      {managerGroups.map((group) => (
                        <Stack key={group.manager.id} align="center" gap={0}>
                          <div style={{ marginBottom: 40 }}>
                            {renderEmployeeCard(group.manager, true)}
                          </div>
                          <Group align="flex-start" gap={12} wrap="nowrap">
                            {group.employees.map((emp) => renderEmployeeCard(emp))}
                          </Group>
                        </Stack>
                      ))}

                      {standaloneEmployees.map((emp) => (
                        <Stack key={emp.id} align="center" gap={0}>
                          {renderEmployeeCard(emp)}
                        </Stack>
                      ))}
                    </Group>
                  )}
                </Stack>
              );
            })}
          </Group>
        </Stack>
      </div>
    </Stack>
  );
}
