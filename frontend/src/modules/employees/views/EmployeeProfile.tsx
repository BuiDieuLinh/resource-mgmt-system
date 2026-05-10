import {
  Stack,
  Group,
  Card,
  Avatar,
  Text,
  Badge,
  Grid,
  Divider,
  ThemeIcon,
  Button,
  Timeline,
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconId,
  IconCalendar,
  IconBuilding,
  IconBriefcase,
  IconGenderMale,
  IconClock,
  IconCoffee,
  IconUser,
  IconMapPin,
  IconUserPlus,
  IconUserMinus,
  IconArrowUpRight,
  IconSwitchHorizontal,
  IconFileText,
  IconUserCheck,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetEmployee } from '../api/get-employee';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useGetActivePolicy } from '../../work-policies/api/get-work-policies';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { employeeListUrl } from '../../../routes/url';
import { Skeleton } from '@mantine/core';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';

import type { IWorkSchedule } from '../types';
import type { IWorkPolicy } from '../../work-policies/types';
import { WorkDayBadges } from '../components/WorkDayBadges';
import {
  minutesToTime,
  formatDate,
  CONTRACT_TYPE_COLOR,
  CONTRACT_TYPE_LABEL,
  type ContractType,
} from '../../../constant';
import { AwardRevealPage } from '../../performance/components/AwardRevealPage';
import { useState } from 'react';
import type { IAward } from '../../performance/types';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color="gray" size="sm" radius="sm" style={{ flexShrink: 0 }}>
        {icon}
      </ThemeIcon>
      <div>
        <Text size="xs" c="dimmed" lh={1.2} component="div">
          {label}
        </Text>
        <Text size="sm" fw={500} lh={1.4} component="div">
          {value}
        </Text>
      </div>
    </Group>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }} mb="sm">
      {children}
    </Text>
  );
}

function WorkScheduleSection({
  schedules,
  policy,
}: {
  schedules?: IWorkSchedule[];
  policy?: IWorkPolicy | null;
}) {
  if (!schedules || schedules.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No work schedule assigned.
      </Text>
    );
  }

  const shiftMap = new Map<string, { start: number; end: number; days: number[] }>();
  for (const s of schedules) {
    const key = `${s.start_time}-${s.end_time}`;
    if (!shiftMap.has(key)) shiftMap.set(key, { start: s.start_time, end: s.end_time, days: [] });
    shiftMap.get(key)!.days.push(s.day_of_week);
  }

  const breakMinutes =
    policy?.break_start != null && policy?.break_end != null
      ? policy.break_end - policy.break_start
      : 0;

  const shifts = Array.from(shiftMap.values()).map((shift) => ({
    ...shift,
    days: shift.days.sort((a, b) => a - b),
    netHours: Math.max(0, (shift.end - shift.start - breakMinutes) / 60),
  }));

  const totalNetHours = shifts.reduce((sum, s) => sum + s.netHours * s.days.length, 0);

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Badge variant="light" color="deepPurple" tt="capitalize">
          {schedules.length} days/week
        </Badge>
        <Badge variant="light" color="violet" tt="capitalize">
          {Math.round(totalNetHours * 10) / 10}h/week
        </Badge>
        {breakMinutes > 0 && (
          <Badge
            variant="light"
            color="gray"
            tt="capitalize"
            leftSection={<IconCoffee size={12} />}
          >
            {breakMinutes}min break
          </Badge>
        )}
      </Group>

      {shifts.map((shift, i) => (
        <Stack key={i} gap="xs">
          {i > 0 && <Divider />}
          <Group gap="xs" mb={6}>
            <IconClock size={16} color="var(--mantine-color-dimmed)" />
            <Text size="sm" fw={600}>
              {minutesToTime(shift.start)} – {minutesToTime(shift.end)}
            </Text>
            <Text size="xs" c="dimmed">
              · {Math.round(shift.netHours * 10) / 10}h net
            </Text>
          </Group>
          <Group gap={6}>
            <WorkDayBadges size="md" days={shift.days} />
          </Group>
        </Stack>
      ))}
    </Stack>
  );
}

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading: _loading, error, refetch } = useGetEmployee(id!);
  const isLoading = useDelayedLoading(_loading);
  const { data: policyData } = useGetActivePolicy();
  const [previewAward, setPreviewAward] = useState<IAward | null>(null);

  if (isLoading)
    return (
      <Stack gap="lg">
        <Skeleton h={16} w={240} radius="sm" />
        <Grid gutter="lg">
          <Grid.Col span={3}>
            <Card withBorder padding="xl" radius="md">
              <Stack align="center" gap="md">
                <Skeleton circle h={96} />
                <Skeleton h={14} w={140} radius="sm" />
                <Skeleton h={10} w={80} radius="sm" />
                <Skeleton h={22} w={60} radius="xl" />
              </Stack>
              <Divider my="md" />
              <Stack gap="sm">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} h={12} radius="sm" />
                ))}
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={9}>
            <Card withBorder padding="xl" radius="md">
              <Stack gap="xl">
                {Array.from({ length: 3 }).map((_, s) => (
                  <Stack key={s} gap="sm">
                    <Skeleton h={10} w={120} radius="sm" />
                    <Grid gutter="lg">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Grid.Col key={i} span={6}>
                          <Skeleton h={36} radius="sm" />
                        </Grid.Col>
                      ))}
                    </Grid>
                    {s < 2 && <Divider />}
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    );

  if (error) {
    const errorMessage = error.message || 'Error loading employee profile';
    const isForbidden =
      errorMessage.includes('403') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('Forbidden');

    return (
      <ErrorState
        message={isForbidden ? 'You do not have permission to view this profile' : errorMessage}
        onRetry={isForbidden ? undefined : refetch}
      />
    );
  }

  if (!data?.data)
    return <ErrorState message="Employee not found" onRetry={() => navigate(employeeListUrl)} />;

  const employee = data.data;

  return (
    <Stack gap="lg">
      <PageHeader
        breadcrumbOnly
        breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: employee.full_name }]}
        right={
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(employeeListUrl)}
            >
              Back to List
            </Button>
          </Group>
        }
      />

      <Grid gutter="lg" align="flex-start">
        <Grid.Col span={3}>
          <Card withBorder padding="xl" radius="md">
            <Stack align="center" gap="md">
              <Avatar
                src={employee.avatar_url}
                size={96}
                radius="50%"
                alt={employee.full_name}
                color="deepPurple"
              >
                <IconUser size={42} />
              </Avatar>
              <Stack align="center" gap={4}>
                <Text size="md" fw={700} ta="center" lh={1.3}>
                  {employee.full_name}
                </Text>
                {employee.display_name && (
                  <Text size="xs" c="dimmed">
                    {employee.display_name}
                  </Text>
                )}
                <Text size="xs" c="dimmed" mt={2}>
                  {employee.employee_code}
                </Text>
              </Stack>
              <Badge
                variant="light"
                color={employee.status === 'active' ? 'green' : 'gray'}
                size="md"
                radius="sm"
              >
                {employee.status}
              </Badge>
            </Stack>

            <Divider my="md" />

            <Stack gap="sm">
              <InfoRow icon={<IconMail size={14} />} label="Email" value={employee.email} />
              {employee.phone && (
                <InfoRow icon={<IconPhone size={14} />} label="Phone" value={employee.phone} />
              )}
              <InfoRow icon={<IconId size={14} />} label="ID Card" value={employee.identify_card} />
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={9}>
          <Card withBorder padding="xl" radius="md">
            <Stack gap="xl">
              <div>
                <SectionTitle>Personal Information</SectionTitle>
                <Grid gutter="lg">
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconGenderMale size={14} />}
                      label="Gender"
                      value={employee.gender || '—'}
                    />
                  </Grid.Col>
                  {employee.date_of_birth && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconCalendar size={14} />}
                        label="Date of Birth"
                        value={formatDate(employee.date_of_birth)}
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconCalendar size={14} />}
                      label="Hire Date"
                      value={formatDate(employee.hire_date)}
                    />
                  </Grid.Col>
                  {employee.terminated_at && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconCalendar size={14} />}
                        label="Terminated Date"
                        value={
                          <Group gap="xs">
                            <Text size="sm" fw={500} c="red">
                              {formatDate(employee.terminated_at)}
                            </Text>
                          </Group>
                        }
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconMapPin size={14} />}
                      label="Address"
                      value={employee.address}
                    />
                  </Grid.Col>
                </Grid>
              </div>

              <Divider />

              <div>
                <SectionTitle>Work Information</SectionTitle>
                <Grid gutter="lg">
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconBuilding size={14} />}
                      label="Department"
                      value={employee.position.department?.department_name || '—'}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconBriefcase size={14} />}
                      label="Position"
                      value={employee.position?.position_name || '—'}
                    />
                  </Grid.Col>
                  {employee.position?.level && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconBriefcase size={14} />}
                        label="Level"
                        value={
                          <Badge variant="light" color="blue" size="sm" radius="sm">
                            {employee.position.level}
                          </Badge>
                        }
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconFileText size={14} />}
                      label="Contract Type"
                      value={
                        <Badge
                          variant="light"
                          color={
                            CONTRACT_TYPE_COLOR[employee.contract_type as ContractType] || 'gray'
                          }
                          size="sm"
                          radius="sm"
                        >
                          {CONTRACT_TYPE_LABEL[employee.contract_type as ContractType] ||
                            employee.contract_type}
                        </Badge>
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconCalendar size={14} />}
                      label="Annual Leave"
                      value={`${employee.annual_leave_days} days/year`}
                    />
                  </Grid.Col>
                  {employee.manager && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconUser size={14} />}
                        label="Manager"
                        value={
                          <Stack gap={2}>
                            <Text size="sm" fw={500}>
                              {employee.manager.full_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {employee.manager.position.position_name}
                            </Text>
                          </Stack>
                        }
                      />
                    </Grid.Col>
                  )}
                </Grid>
              </div>

              <Divider />

              <div>
                <SectionTitle>Work Schedule</SectionTitle>
                <WorkScheduleSection
                  schedules={employee.work_schedules}
                  policy={policyData?.data}
                />
              </div>

              {employee.employment_histories && employee.employment_histories.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>Employment History</SectionTitle>
                    <Timeline
                      active={employee.employment_histories.length}
                      bulletSize={32}
                      lineWidth={2}
                    >
                      {employee.employment_histories.map((history) => {
                        const eventConfig = {
                          hired: { icon: IconUserPlus, color: 'indigo', label: 'Hired' },
                          contract_changed: {
                            icon: IconFileText,
                            color: 'violet',
                            label: 'Contract Changed',
                          },
                          promoted: { icon: IconArrowUpRight, color: 'grape', label: 'Promoted' },
                          transferred: {
                            icon: IconSwitchHorizontal,
                            color: 'blue',
                            label: 'Transferred',
                          },
                          resigned: { icon: IconUserMinus, color: 'orange', label: 'Resigned' },
                          terminated: { icon: IconUserMinus, color: 'red', label: 'Terminated' },
                          rehired: { icon: IconUserCheck, color: 'green', label: 'Rehired' },
                        };

                        const config = eventConfig[history.event_type] || {
                          icon: IconFileText,
                          color: 'gray',
                          label: history.event_type,
                        };
                        const Icon = config.icon;

                        return (
                          <Timeline.Item
                            key={history.id}
                            bullet={<Icon size={16} />}
                            color={config.color}
                            title={
                              <Group gap="xs">
                                <Text size="sm" fw={600}>
                                  {config.label}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  •
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {formatDate(history.start_date)}
                                </Text>
                              </Group>
                            }
                          >
                            <Stack gap={6} mt={4}>
                              {/* Position info */}
                              {history.from_pos && history.to_pos ? (
                                <Group gap={6}>
                                  <Text size="xs" c="dimmed">
                                    {history.from_pos.position_name}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    →
                                  </Text>
                                  <Text size="xs" fw={500}>
                                    {history.to_pos.position_name}
                                  </Text>
                                </Group>
                              ) : history.to_pos ? (
                                <Text size="xs" fw={500}>
                                  {history.to_pos.position_name}
                                </Text>
                              ) : null}

                              {/* Contract type */}
                              {history.contract_type && (
                                <Group gap={6}>
                                  <Text size="xs" c="dimmed">
                                    Contract:
                                  </Text>
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={
                                      CONTRACT_TYPE_COLOR[history.contract_type as ContractType] ||
                                      'gray'
                                    }
                                  >
                                    {CONTRACT_TYPE_LABEL[history.contract_type as ContractType] ||
                                      history.contract_type}
                                  </Badge>
                                </Group>
                              )}

                              {/* Comment */}
                              {history.comment && (
                                <Text size="xs" c="dimmed" fs="italic">
                                  {history.comment}
                                </Text>
                              )}
                            </Stack>
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>
                  </div>
                </>
              )}

              {(employee.position?.description || employee.position?.department?.description) && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>Additional Information</SectionTitle>
                    <Stack gap="md">
                      {employee.position?.description && (
                        <InfoRow
                          icon={<IconBriefcase size={14} />}
                          label="Position Description"
                          value={employee.position.description}
                        />
                      )}
                      {employee.position.department?.description && (
                        <InfoRow
                          icon={<IconBuilding size={14} />}
                          label="Department Description"
                          value={employee.position.department.description}
                        />
                      )}
                    </Stack>
                  </div>
                </>
              )}

              {/* {myAwards.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>Awards & Recognition</SectionTitle>
                    <Stack gap="sm" mt="sm">
                      {myAwards.map((award) => (
                        <Group
                          key={award.id}
                          justify="space-between"
                          p="sm"
                          style={{
                            background: 'var(--mantine-color-gray-0)',
                            borderRadius: 8,
                            border: '1px solid var(--mantine-color-gray-2)',
                          }}
                        >
                          <Group gap="sm">
                            <ThemeIcon size="md" radius="xl" variant="light" color="yellow">
                              <IconTrophy size={16} color={RANK_COLORS[(award.rank - 1) % 3]} />
                            </ThemeIcon>
                            <Stack gap={2}>
                              <Text size="sm" fw={600}>
                                {award.title}
                              </Text>
                              <Group gap={6}>
                                <Badge size="xs" variant="light" color="blue">
                                  {CATEGORY_LABEL[award.category] ?? award.category}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                  {award.cycle?.title}
                                </Text>
                              </Group>
                            </Stack>
                          </Group>
                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconEye size={14} />}
                            onClick={() => setPreviewAward(award)}
                          >
                            Preview
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  </div>
                </>
              )} */}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {previewAward && (
        <AwardRevealPage
          awards={[previewAward]}
          onClose={() => setPreviewAward(null)}
          previewMode
        />
      )}
    </Stack>
  );
}
