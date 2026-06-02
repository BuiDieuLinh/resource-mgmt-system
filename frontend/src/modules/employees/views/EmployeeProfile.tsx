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
  IconCamera,
  IconTrophy,
  IconEye,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetEmployee } from '../api/get-employee';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useGetActivePolicy } from '../../work-policies/api/get-work-policies';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { employeeListUrl } from '../../../routes/url';
import { Skeleton } from '@mantine/core';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { parseApiError } from '../../../utils/error';

import type { IWorkSchedule } from '../types';
import type { IWorkPolicy } from '../../work-policies/types';
import { WorkDayBadges } from '../components/WorkDayBadges';
import {
  minutesToTime,
  formatDate,
  CONTRACT_TYPE_COLOR,
  type ContractType,
} from '../../../constant';
import { AwardRevealPage } from '../../performance/components/AwardRevealPage';
import { useState } from 'react';
import type { IAward } from '../../performance/types';
import { FaceEnrollmentModal } from '../components/FaceEnrollmentModal';
import { useGetEmployeeByUserId } from '../api/get-employee-by-user';
import { useTranslation } from 'react-i18next';
import { CATEGORY_LABEL, RANK_COLORS } from '../../performance/constants/awards';

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
  const { t } = useTranslation();
  if (!schedules || schedules.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('employee.noWorkScheduleAssigned')}
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
          {t('employee.daysPerWeek', { count: schedules.length })}
        </Badge>
        <Badge variant="light" color="violet" tt="capitalize">
          {t('employee.hoursPerWeek', { count: Math.round(totalNetHours * 10) / 10 })}
        </Badge>
        {breakMinutes > 0 && (
          <Badge
            variant="light"
            color="gray"
            tt="capitalize"
            leftSection={<IconCoffee size={12} />}
          >
            {t('employee.breakMinutes', { count: breakMinutes })}
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
              · {t('employee.netHours', { count: Math.round(shift.netHours * 10) / 10 })}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading: _loading, error, refetch } = useGetEmployee(id!);
  const { data: empData } = useGetEmployeeByUserId();
  const isLoading = useDelayedLoading(_loading);
  const { data: policyData } = useGetActivePolicy();
  const [previewAward, setPreviewAward] = useState<IAward | null>(null);
  const [faceEnrollmentOpened, setFaceEnrollmentOpened] = useState(false);

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
    const parsedError = parseApiError(error, t('messages.errorLoadingEmployeeProfile'));

    return (
      <ErrorState
        message={parsedError.isForbidden ? t('messages.noPermissionProfile') : parsedError.message}
        onRetry={parsedError.isForbidden ? undefined : refetch}
      />
    );
  }

  if (!data?.data)
    return (
      <ErrorState
        message={t('messages.employeeNotFound')}
        onRetry={() => navigate(employeeListUrl)}
      />
    );

  const employee = data.data;
  const myAwards = employee.awards || [];
  const currentUserEmployee = empData?.data;
  const hasFaceRegistered =
    employee.face_descriptor &&
    Array.isArray(employee.face_descriptor) &&
    employee.face_descriptor.length > 0;

  return (
    <Stack gap="lg">
      <PageHeader
        breadcrumbOnly
        breadcrumbs={[
          { labelKey: 'nav.employees', path: '/employees' },
          { label: employee.full_name },
        ]}
        right={
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(employeeListUrl)}
            >
              {t('employee.backToList')}
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
                {employee.status === 'active'
                  ? t('employee.activeEmployee')
                  : t('employee.inactiveEmployee')}
              </Badge>
            </Stack>

            <Divider my="md" />

            <Stack gap="sm">
              <InfoRow
                icon={<IconMail size={14} />}
                label={t('employee.email')}
                value={employee.email}
              />
              {employee.phone && (
                <InfoRow
                  icon={<IconPhone size={14} />}
                  label={t('employee.phone')}
                  value={employee.phone}
                />
              )}
              <InfoRow
                icon={<IconId size={14} />}
                label={t('employee.idCard')}
                value={employee.identify_card}
              />
            </Stack>

            {/* Face Recognition Section - Only show for own profile */}
            {employee && currentUserEmployee && employee.id === currentUserEmployee.id && (
              <>
                <Divider my="md" />
                <Stack gap="xs">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={600}>
                        {t('employee.faceRecognition')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {hasFaceRegistered ? t('employee.registered') : t('employee.notRegistered')}
                      </Text>
                    </div>
                    {!hasFaceRegistered && (
                      <Button
                        size="xs"
                        variant="filled"
                        leftSection={<IconCamera size={14} />}
                        onClick={() => setFaceEnrollmentOpened(true)}
                      >
                        {t('employee.register')}
                      </Button>
                    )}
                  </Group>
                </Stack>
              </>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={9}>
          <Card withBorder padding="xl" radius="md">
            <Stack gap="xl">
              <div>
                <SectionTitle>{t('employee.personalInformation')}</SectionTitle>
                <Grid gutter="lg">
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconGenderMale size={14} />}
                      label={t('employee.gender')}
                      value={employee.gender || '—'}
                    />
                  </Grid.Col>
                  {employee.date_of_birth && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconCalendar size={14} />}
                        label={t('employee.dateOfBirth')}
                        value={formatDate(employee.date_of_birth)}
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconCalendar size={14} />}
                      label={t('employee.hireDate')}
                      value={formatDate(employee.hire_date)}
                    />
                  </Grid.Col>
                  {employee.terminated_at && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconCalendar size={14} />}
                        label={t('employee.terminatedDate')}
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
                      label={t('employee.address')}
                      value={employee.address}
                    />
                  </Grid.Col>
                </Grid>
              </div>

              <Divider />

              <div>
                <SectionTitle>{t('employee.workInformation')}</SectionTitle>
                <Grid gutter="lg">
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconBuilding size={14} />}
                      label={t('employee.department')}
                      value={employee.position.department?.department_name || '—'}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconBriefcase size={14} />}
                      label={t('employee.position')}
                      value={employee.position?.position_name || '—'}
                    />
                  </Grid.Col>
                  {employee.position?.level && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconBriefcase size={14} />}
                        label={t('employee.level')}
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
                      label={t('employee.contractType')}
                      value={
                        <Badge
                          variant="light"
                          color={
                            CONTRACT_TYPE_COLOR[employee.contract_type as ContractType] || 'gray'
                          }
                          size="sm"
                          radius="sm"
                        >
                          {t(`labels.contractType.${employee.contract_type as ContractType}`)}
                        </Badge>
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconCalendar size={14} />}
                      label={t('employee.annualLeave')}
                      value={t('employee.daysPerYear', { count: employee.annual_leave_days })}
                    />
                  </Grid.Col>
                  {employee.manager && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconUser size={14} />}
                        label={t('employee.manager')}
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
                <SectionTitle>{t('employee.workSchedule')}</SectionTitle>
                <WorkScheduleSection
                  schedules={employee.work_schedules}
                  policy={policyData?.data}
                />
              </div>

              {employee.employment_histories && employee.employment_histories.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>{t('employee.employmentHistory')}</SectionTitle>
                    <Timeline
                      active={employee.employment_histories.length}
                      bulletSize={32}
                      lineWidth={2}
                    >
                      {employee.employment_histories.map((history) => {
                        const eventConfig = {
                          hired: {
                            icon: IconUserPlus,
                            color: 'indigo',
                            label: t('employee.historyEvent.hired'),
                          },
                          contract_changed: {
                            icon: IconFileText,
                            color: 'violet',
                            label: t('employee.historyEvent.contract_changed'),
                          },
                          promoted: {
                            icon: IconArrowUpRight,
                            color: 'grape',
                            label: t('employee.historyEvent.promoted'),
                          },
                          transferred: {
                            icon: IconSwitchHorizontal,
                            color: 'blue',
                            label: t('employee.historyEvent.transferred'),
                          },
                          resigned: {
                            icon: IconUserMinus,
                            color: 'orange',
                            label: t('employee.historyEvent.resigned'),
                          },
                          terminated: {
                            icon: IconUserMinus,
                            color: 'red',
                            label: t('employee.historyEvent.terminated'),
                          },
                          rehired: {
                            icon: IconUserCheck,
                            color: 'green',
                            label: t('employee.historyEvent.rehired'),
                          },
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
                                    {t('employee.contract')}:
                                  </Text>
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={
                                      CONTRACT_TYPE_COLOR[history.contract_type as ContractType] ||
                                      'gray'
                                    }
                                  >
                                    {t(
                                      `labels.contractType.${history.contract_type as ContractType}`,
                                    )}
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
                    <SectionTitle>{t('employee.additionalInformation')}</SectionTitle>
                    <Stack gap="md">
                      {employee.position?.description && (
                        <InfoRow
                          icon={<IconBriefcase size={14} />}
                          label={t('employee.positionDescription')}
                          value={employee.position.description}
                        />
                      )}
                      {employee.position.department?.description && (
                        <InfoRow
                          icon={<IconBuilding size={14} />}
                          label={t('employee.departmentDescription')}
                          value={employee.position.department.description}
                        />
                      )}
                    </Stack>
                  </div>
                </>
              )}

              {myAwards.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>{t('employee.awardsRecognition')}</SectionTitle>
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
                            {t('actions.preview')}
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  </div>
                </>
              )}
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

      {/* Face Enrollment Modal */}
      {employee && (
        <FaceEnrollmentModal
          opened={faceEnrollmentOpened}
          onClose={() => setFaceEnrollmentOpened(false)}
          onSuccess={() => window.location.reload()}
          employeeId={employee.id}
          employeeName={employee.full_name}
        />
      )}
    </Stack>
  );
}
