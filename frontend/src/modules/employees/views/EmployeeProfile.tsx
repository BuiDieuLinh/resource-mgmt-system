import { Stack, Group, Card, Avatar, Text, Badge, Grid, Divider, ThemeIcon } from '@mantine/core';
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
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetEmployee } from '../api/get-employee';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useGetActivePolicy } from '../../work-policies/api/get-work-policies';
import { Loading } from '../../../components/Loading/Loading';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { employeeListUrl } from '../../../routes/url';

import type { IWorkSchedule } from '../types';
import type { IWorkPolicy } from '../../work-policies/types';
import { WorkDayBadges } from '../components/WorkDayBadges';
import { minutesToTime } from '../utils/time-option';

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
        <Text size="xs" c="dimmed" lh={1.2}>
          {label}
        </Text>
        <Text size="sm" fw={500} lh={1.4}>
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
        <Badge variant="light" color="deepPurple" size="sm">
          {schedules.length} days/week
        </Badge>
        <Badge variant="light" color="violet" size="sm">
          {Math.round(totalNetHours * 10) / 10}h/week
        </Badge>
        {breakMinutes > 0 && (
          <Badge variant="light" color="gray" size="sm" leftSection={<IconCoffee size={10} />}>
            {breakMinutes}min break
          </Badge>
        )}
      </Group>

      {shifts.map((shift, i) => (
        <Stack key={i} gap="xs">
          {i > 0 && <Divider />}
          <Group gap="xs" mb={6}>
            <IconClock size={14} color="var(--mantine-color-dimmed)" />
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

  const { data, isLoading, error, refetch } = useGetEmployee(id!);
  const { data: policyData } = useGetActivePolicy();

  if (isLoading) return <Loading />;
  if (error)
    return (
      <ErrorState message={`Error loading employee profile: ${error.message}`} onRetry={refetch} />
    );
  if (!data?.data)
    return <ErrorState message="Employee not found" onRetry={() => navigate(employeeListUrl)} />;

  const employee = data.data;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Stack gap="lg">
      <PageHeader
        breadcrumbOnly
        breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: employee.full_name }]}
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
                <IconUser size={40} />
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
              <InfoRow icon={<IconMail size={12} />} label="Email" value={employee.email} />
              {employee.phone && (
                <InfoRow icon={<IconPhone size={12} />} label="Phone" value={employee.phone} />
              )}
              <InfoRow icon={<IconId size={12} />} label="ID Card" value={employee.identify_card} />
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
                      icon={<IconGenderMale size={12} />}
                      label="Gender"
                      value={employee.gender || '—'}
                    />
                  </Grid.Col>
                  {employee.date_of_birth && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconCalendar size={12} />}
                        label="Date of Birth"
                        value={formatDate(employee.date_of_birth)}
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconCalendar size={12} />}
                      label="Hire Date"
                      value={formatDate(employee.hire_date)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconMapPin size={12} />}
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
                      icon={<IconBuilding size={12} />}
                      label="Department"
                      value={employee.position.department?.department_name || '—'}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconBriefcase size={12} />}
                      label="Position"
                      value={employee.position?.position_name || '—'}
                    />
                  </Grid.Col>
                  {employee.position?.level && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconBriefcase size={12} />}
                        label="Level"
                        value={
                          <Badge variant="light" color="blue" size="sm" radius="sm">
                            {employee.position.level}
                          </Badge>
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

              {(employee.position?.description || employee.position?.department?.description) && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>Additional Information</SectionTitle>
                    <Stack gap="md">
                      {employee.position?.description && (
                        <InfoRow
                          icon={<IconBriefcase size={12} />}
                          label="Position Description"
                          value={employee.position.description}
                        />
                      )}
                      {employee.position.department?.description && (
                        <InfoRow
                          icon={<IconBuilding size={12} />}
                          label="Department Description"
                          value={employee.position.department.description}
                        />
                      )}
                    </Stack>
                  </div>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
