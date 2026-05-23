import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Select,
  Textarea,
  Loader,
  Center,
  Grid,
  Alert,
  Paper,
  ThemeIcon,
  Progress,
  Box,
  Divider,
  ScrollArea,
  Tooltip,
  NumberInput,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconCheck,
  IconChartBar,
  IconUser,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconChevronRight,
  IconSend,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useUrlParams } from '@/hooks/useUrlParams';
import {
  useGetCycles,
  useGetReviewsByCycle,
  useCreateReview,
  useSubmitReview,
  useGetTemplate,
} from '../api';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { notify } from '@/components/Notification';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  EMPLOYEE_ROLE,
  REVIEW_STATUS_COLOR,
  REVIEW_STATUS_LABEL,
  PROBATION_RESULT_LABEL,
  INTERN_RESULT_LABEL,
} from '@/constant';
import type { IEvaluationCriteria, IReviewCycle, IPerformanceReview } from '../types';

interface CriteriaScore {
  criteria_id: string;
  score: number;
  note: string;
}

interface FormValues {
  score: number;
  comment: string;
  achievements: string;
  result: string;
  criteriaScores: CriteriaScore[];
}

function buildCriteriaScores(criteria: IEvaluationCriteria[]): CriteriaScore[] {
  return criteria.map((c) => ({
    criteria_id: c.id,
    score: Math.floor(c.max_score / 2),
    note: '',
  }));
}

function calcWeightedScore(
  criteriaScores: CriteriaScore[],
  criteria: IEvaluationCriteria[],
): number {
  let total = 0;
  for (const c of criteria) {
    const entry = criteriaScores.find((s) => s.criteria_id === c.id);
    if (entry) total += ((entry.score / c.max_score) * 100 * c.weight) / 100;
  }
  return Math.round(total);
}

function calcRawAverage(
  criteriaScores: CriteriaScore[],
  criteria: IEvaluationCriteria[],
): { raw: number; max: number } {
  const scaleMax = criteria[0]?.max_score ?? 5;
  if (criteria.length === 0) return { raw: 0, max: scaleMax };

  const totalScore = criteria.reduce((sum, c) => {
    const entry = criteriaScores.find((s) => s.criteria_id === c.id);
    return sum + ((entry?.score ?? 0) / c.max_score) * scaleMax;
  }, 0);

  return {
    raw: Math.round((totalScore / criteria.length) * 10) / 10,
    max: scaleMax,
  };
}

function getGradeLabel(score: number, max = 100) {
  const pct = max > 0 ? (score / max) * 100 : score;
  if (pct >= 90) return { label: 'Excellent', color: 'green' };
  if (pct >= 75) return { label: 'Good', color: 'blue' };
  if (pct >= 60) return { label: 'Average', color: 'yellow' };
  return { label: 'Below Average', color: 'red' };
}

function pickActiveCycle(cycles: IReviewCycle[]): IReviewCycle | null {
  if (!cycles.length) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const quarterMatch = cycles.find(
    (c) =>
      c.period_type === 'quarterly' &&
      c.period_year === currentYear &&
      c.period_seq === currentQuarter,
  );
  if (quarterMatch) return quarterMatch;

  const monthMatch = cycles.find(
    (c) =>
      c.period_type === 'monthly' && c.period_year === currentYear && c.period_seq === currentMonth,
  );
  if (monthMatch) return monthMatch;

  return [...cycles].sort((a, b) =>
    a.period_year !== b.period_year ? b.period_year - a.period_year : b.period_seq - a.period_seq,
  )[0];
}

export default function PerformanceReviewPage() {
  const { user } = useAuth();
  const { get, set } = useUrlParams();
  const { data: cycles = [] } = useGetCycles();
  const { data: myEmpData } = useGetEmployeeByUserId();
  const myEmployeeId = myEmpData?.data?.id;
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const isPrivilegedViewer = user?.roles?.some((role) =>
    [EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR].includes(role as any),
  );

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const isManualCycleChangeRef = useRef(false);
  const requestedCycleId = get('cycleId');
  const requestedEmployeeId = get('employeeId');

  useEffect(() => {
    if (!cycles.length) return;

    if (isManualCycleChangeRef.current) {
      if (requestedCycleId === selectedCycleId) {
        isManualCycleChangeRef.current = false;
      }
      return;
    }

    if (
      requestedCycleId &&
      (cycles as IReviewCycle[]).some((cycle) => cycle.id === requestedCycleId)
    ) {
      if (selectedCycleId !== requestedCycleId) {
        setSelectedCycleId(requestedCycleId);
        setSelectedEmployeeId(null);
        form.reset();
      }
      return;
    }

    if (!requestedCycleId && !selectedCycleId) {
      const active = pickActiveCycle(cycles as IReviewCycle[]);
      if (active) setSelectedCycleId(active.id);
    }
  }, [cycles, requestedCycleId, selectedCycleId]);

  const selectedCycle = (cycles as IReviewCycle[]).find((c) => c.id === selectedCycleId) ?? null;

  const { data: reviews = [], isLoading: reviewsLoading } = useGetReviewsByCycle(
    selectedCycleId ?? '',
  );

  const { data: templateData } = useGetTemplate(selectedCycle?.template_id ?? '');
  const template = selectedCycle?.template_id ? templateData : null;

  const createReview = useCreateReview();
  const submitReview = useSubmitReview();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);

  const existingReview = (reviews as IPerformanceReview[]).find(
    (r) => r.employee_id === selectedEmployeeId,
  );
  const isPublished = existingReview?.status === 'published';
  const isSubmitted = existingReview?.status === 'submitted';
  const isDone = isPublished || isSubmitted;
  const selectedEmpData = existingReview?.employee;
  const contractType = selectedEmpData?.contract_type;
  const canPrivilegedEditCurrentReview = Boolean(
    isPrivilegedViewer &&
    myEmployeeId &&
    existingReview &&
    (existingReview.assignment?.reviewer_id === myEmployeeId ||
      existingReview.employee?.manager_id === myEmployeeId),
  );
  const isReadOnly = Boolean((isPrivilegedViewer && !canPrivilegedEditCurrentReview) || isDone);

  const form = useForm<FormValues>({
    initialValues: {
      score: 70,
      comment: '',
      achievements: '',
      result: '',
      criteriaScores: [],
    },
  });

  useEffect(() => {
    if (
      template?.criteria &&
      template.criteria.length > 0 &&
      form.values.criteriaScores.length === 0
    ) {
      form.setFieldValue('criteriaScores', buildCriteriaScores(template.criteria));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  const calculatedScore = useMemo(() => {
    if (!template?.criteria || form.values.criteriaScores.length === 0) return form.values.score;
    return calcWeightedScore(form.values.criteriaScores, template.criteria);
  }, [template, form.values.criteriaScores, form.values.score]);

  const calculatedRaw = useMemo(() => {
    if (!template?.criteria || form.values.criteriaScores.length === 0) return null;
    return calcRawAverage(form.values.criteriaScores, template.criteria);
  }, [template, form.values.criteriaScores]);

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setHighlightedEmployeeId(empId);
    set({ employeeId: empId });
    const existing = (reviews as IPerformanceReview[]).find((r) => r.employee_id === empId);
    if (existing) {
      form.setValues({
        score: existing.total_score ?? 70,
        comment: existing.comment ?? '',
        achievements: existing.achievements ?? '',
        result: existing.result ?? '',
        criteriaScores:
          existing.score_details && existing.score_details.length > 0
            ? existing.score_details.map((sd) => ({
                criteria_id: sd.criteria_id,
                score: sd.score,
                note: sd.note ?? '',
              }))
            : template?.criteria
              ? buildCriteriaScores(template.criteria)
              : [],
      });
    } else {
      form.setValues({
        score: 70,
        comment: '',
        achievements: '',
        result: '',
        criteriaScores: template?.criteria ? buildCriteriaScores(template.criteria) : [],
      });
    }
  };

  const buildPayload = () => {
    const hasCriteria = template?.criteria && template.criteria.length > 0;
    return {
      cycle_id: selectedCycleId!,
      employee_id: selectedEmployeeId!,
      reviewer_id: myEmployeeId!,
      total_score: Math.max(0, hasCriteria ? calculatedScore : form.values.score),
      comment: form.values.comment,
      achievements: form.values.achievements,
      result: form.values.result || undefined,
      score_details: hasCriteria
        ? form.values.criteriaScores.map((cs) => {
            const c = template!.criteria!.find((x) => x.id === cs.criteria_id);
            return {
              criteria_id: cs.criteria_id,
              criteria_name: c?.criterion ?? '',
              weight: c?.weight ?? 0,
              max_score: c?.max_score ?? 5,
              score: cs.score,
              note: cs.note,
            };
          })
        : undefined,
    };
  };

  const handleSave = async (submit = false) => {
    if (!selectedCycleId || !selectedEmployeeId || !myEmployeeId) {
      notify.error('', { message: 'Missing required data' });
      return;
    }
    if (
      submit &&
      (contractType === 'probation' || contractType === 'intern') &&
      !form.values.result
    ) {
      notify.error('', { message: 'Result is required for probation/intern reviews' });
      return;
    }

    const payload = buildPayload();
    const nid = notify.loading(submit ? 'Submitting...' : 'Saving draft...');
    try {
      if (submit && existingReview) {
        await submitReview.mutateAsync({ id: existingReview.id, ...payload });
      } else if (submit && !existingReview) {
        const created = await createReview.mutateAsync(payload);
        const reviewId = created?.data?.id;
        if (reviewId) await submitReview.mutateAsync({ id: reviewId, ...payload });
      } else {
        await createReview.mutateAsync(payload);
      }
      notify.success(nid, { message: submit ? 'Review submitted' : 'Draft saved' });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'An error occurred' });
    }
  };

  const totalCount = reviews.length;
  const doneCount = (reviews as IPerformanceReview[]).filter(
    (r) => r.status === 'submitted' || r.status === 'published',
  ).length;
  const draftCount = (reviews as IPerformanceReview[]).filter((r) => r.status === 'draft').length;
  const pendingCount = totalCount - doneCount - draftCount;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const cycleOptions = (cycles as IReviewCycle[]).map((c) => ({
    value: c.id,
    label: `${c.title} (${c.period_type === 'quarterly' ? 'Q' + c.period_seq : 'M' + c.period_seq} ${c.period_year})`,
  }));

  const probationResultOptions = Object.entries(PROBATION_RESULT_LABEL).map(([value, label]) => ({
    value,
    label,
  }));
  const internResultOptions = Object.entries(INTERN_RESULT_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  const grade = getGradeLabel(
    calculatedRaw ? calculatedRaw.raw : calculatedScore,
    calculatedRaw ? calculatedRaw.max : 100,
  );

  useEffect(() => {
    if (!reviews.length) return;

    if (
      requestedEmployeeId &&
      (reviews as IPerformanceReview[]).some((review) => review.employee_id === requestedEmployeeId)
    ) {
      if (selectedEmployeeId !== requestedEmployeeId) {
        handleSelectEmployee(requestedEmployeeId);
      }
      return;
    }

    if (!selectedEmployeeId) {
      handleSelectEmployee((reviews as IPerformanceReview[])[0].employee_id);
    }
  }, [requestedEmployeeId, reviews]);

  useEffect(() => {
    if (!highlightedEmployeeId) return;
    const timeout = window.setTimeout(() => setHighlightedEmployeeId(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [highlightedEmployeeId]);

  return (
    <Stack gap="md">
      <PageHeader
        title="Performance Review"
        description={
          isPrivilegedViewer && !canPrivilegedEditCurrentReview
            ? 'View assigned review results by cycle'
            : 'Evaluate only the employees assigned to you in the selected cycle'
        }
      />

      <Card withBorder p="sm">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" fw={600}>
              Cycle:
            </Text>
            <Select
              size="sm"
              data={cycleOptions}
              value={selectedCycleId}
              onChange={(val) => {
                isManualCycleChangeRef.current = true;
                setSelectedCycleId(val);
                setSelectedEmployeeId(null);
                set({ cycleId: val, employeeId: null });
                form.reset();
              }}
              checkIconPosition="right"
              style={{ width: 280 }}
              placeholder="Select cycle..."
            />
          </Group>

          {selectedCycleId && totalCount > 0 && (
            <Group gap="xs">
              <Badge variant="light" color="gray" size="sm">
                {totalCount} total
              </Badge>
              <Badge variant="light" color="green" size="sm">
                {doneCount} done
              </Badge>
              <Badge variant="light" color="yellow" size="sm">
                {draftCount} draft
              </Badge>
              <Badge variant="light" color="red" size="sm">
                {pendingCount} pending
              </Badge>
            </Group>
          )}
        </Group>
      </Card>

      {!selectedCycleId ? (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <IconChartBar size={40} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed">Select a cycle to start reviewing</Text>
          </Stack>
        </Center>
      ) : reviewsLoading ? (
        <Center h={300}>
          <Loader />
        </Center>
      ) : reviews.length === 0 ? (
        <Center h={300}>
          <Stack align="center" gap="xs">
            <IconUser size={40} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed">No employees assigned to this cycle</Text>
          </Stack>
        </Center>
      ) : (
        <Grid gutter="md">
          {/* ── Left: employee list ── */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder p={0} style={{ overflow: 'hidden' }}>
              <Box
                px="md"
                py="sm"
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
              >
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    Employees
                  </Text>
                  <Text size="xs" c="dimmed">
                    {doneCount}/{totalCount}
                  </Text>
                </Group>
                <Progress
                  value={totalCount > 0 ? (doneCount / totalCount) * 100 : 0}
                  size="xs"
                  mt={6}
                  color="green"
                />
              </Box>

              <ScrollArea h={600}>
                <Stack gap={0}>
                  {(reviews as IPerformanceReview[]).map((r, i) => {
                    const isSelected = r.employee_id === selectedEmployeeId;
                    const isHighlighted = r.employee_id === highlightedEmployeeId;
                    const done = r.status === 'submitted' || r.status === 'published';
                    const draft = r.status === 'draft';

                    return (
                      <Box key={r.id}>
                        <Box
                          px="md"
                          py="sm"
                          style={{
                            cursor: 'pointer',
                            background: isSelected
                              ? isDark
                                ? 'var(--mantine-color-blue-9)'
                                : 'var(--mantine-color-blue-0)'
                              : isHighlighted
                                ? 'var(--mantine-color-yellow-0)'
                                : 'transparent',
                            borderLeft: isSelected
                              ? '3px solid var(--mantine-color-blue-5)'
                              : isHighlighted
                                ? '3px solid var(--mantine-color-yellow-5)'
                                : '3px solid transparent',
                            transition: 'background-color 0.2s ease, border-color 0.2s ease',
                          }}
                          onClick={() => handleSelectEmployee(r.employee_id)}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                              <ThemeIcon
                                size="sm"
                                variant="light"
                                color={done ? 'green' : draft ? 'yellow' : 'gray'}
                                radius="xl"
                                style={{ flexShrink: 0 }}
                              >
                                {done ? (
                                  <IconCircleCheck size={12} />
                                ) : draft ? (
                                  <IconDeviceFloppy size={12} />
                                ) : (
                                  <IconClock size={12} />
                                )}
                              </ThemeIcon>
                              <Box style={{ minWidth: 0 }}>
                                <Text size="xs" fw={500} lineClamp={1}>
                                  {r.employee?.full_name}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {r.employee?.position?.department?.department_name}
                                </Text>
                              </Box>
                            </Group>
                            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                              {done &&
                                (() => {
                                  const details = r.score_details;
                                  let displayScore: string | number = '—';
                                  if (details && details.length > 0) {
                                    const scaleMax = details[0]?.max_score ?? 5;
                                    const avg =
                                      details.reduce(
                                        (sum, sd) => sum + (sd.score / sd.max_score) * scaleMax,
                                        0,
                                      ) / details.length;
                                    displayScore = `${Math.round(avg * 10) / 10}/${scaleMax}`;
                                  } else if (r.total_score != null) {
                                    displayScore = r.total_score;
                                  }
                                  return (
                                    <Badge size="xs" variant="light" color="blue">
                                      {displayScore}
                                    </Badge>
                                  );
                                })()}
                              <IconChevronRight size={12} color="var(--mantine-color-dimmed)" />
                            </Group>
                          </Group>
                        </Box>
                        {i < reviews.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Stack>
              </ScrollArea>

              {totalCount > 0 && (
                <Box px="md" py="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                  {allDone ? (
                    <Alert
                      icon={<IconCircleCheck size={14} />}
                      color="green"
                      variant="light"
                      p="xs"
                    >
                      <Text size="xs">All reviews completed!</Text>
                    </Alert>
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      {totalCount - doneCount} remaining
                    </Text>
                  )}
                </Box>
              )}
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 9 }}>
            {!selectedEmployeeId ? (
              <Card withBorder h={400}>
                <Center h="100%">
                  <Stack align="center" gap="xs">
                    <IconUser size={40} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" size="sm">
                      {isPrivilegedViewer && !canPrivilegedEditCurrentReview
                        ? 'Select an employee from the list to view review details'
                        : 'Select an employee from the list to start reviewing'}
                    </Text>
                  </Stack>
                </Center>
              </Card>
            ) : (
              <Stack gap="md">
                <Card withBorder p="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    {/* Left: employee info */}
                    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <ThemeIcon
                        size="lg"
                        variant="light"
                        color="blue"
                        radius="xl"
                        style={{ flexShrink: 0 }}
                      >
                        <IconUser size={18} />
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Group gap="xs" wrap="nowrap">
                          <Text fw={600} lineClamp={1}>
                            {selectedEmpData?.full_name ?? '—'}
                          </Text>
                          {existingReview && (
                            <Badge
                              color={REVIEW_STATUS_COLOR[existingReview.status] ?? 'gray'}
                              variant="light"
                              size="sm"
                            >
                              {REVIEW_STATUS_LABEL[existingReview.status]}
                            </Badge>
                          )}
                          {existingReview?.employee?.contract_type && (
                            <Badge variant="outline" color="gray" size="xs">
                              {existingReview.employee.contract_type}
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {selectedEmpData?.position?.position_name} ·{' '}
                          {selectedEmpData?.position?.department?.department_name}
                        </Text>
                      </Box>
                    </Group>

                    <Divider orientation="vertical" mx="sm" />

                    {/* Center: score ring */}
                    <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Box>
                        <Text size="xs" c="dimmed">
                          {template?.criteria && template.criteria.length > 0
                            ? 'Avg Score'
                            : 'Score'}
                        </Text>
                        {calculatedRaw ? (
                          <Group gap={2} align="baseline">
                            <Text size="lg" fw={700} lh={1.2}>
                              {calculatedRaw.raw}
                            </Text>
                            <Text size="xs" c="dimmed" fw={400}>
                              / {calculatedRaw.max}
                            </Text>
                          </Group>
                        ) : (
                          <Text size="lg" fw={700} lh={1.2}>
                            {calculatedScore}
                            <Text span size="xs" c="dimmed" fw={400}>
                              {' '}
                              pts
                            </Text>
                          </Text>
                        )}
                        <Badge size="xs" color={grade.color} variant="light" mt={2}>
                          {grade.label}
                        </Badge>
                      </Box>
                    </Group>

                    {existingReview && (
                      <>
                        <Divider orientation="vertical" mx="sm" />
                        {/* Right: attendance stats */}
                        <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
                          <Box ta="center">
                            <Text size="md" fw={700} c="blue">
                              {existingReview.attendance_days ?? '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Present
                            </Text>
                          </Box>
                          <Box ta="center">
                            <Text size="md" fw={700} c="orange">
                              {existingReview.late_count ?? '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Late
                            </Text>
                          </Box>
                          <Box ta="center">
                            <Text size="md" fw={700} c="red">
                              {existingReview.absent_count ?? '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Absent
                            </Text>
                          </Box>
                        </Group>
                      </>
                    )}
                  </Group>
                </Card>

                {template?.criteria && template.criteria.length > 0 ? (
                  <Card withBorder p="md">
                    <Group justify="space-between" mb="md">
                      <Text fw={600}>Evaluation Criteria</Text>
                      <Badge variant="light" size="sm">
                        {template.title}
                      </Badge>
                    </Group>
                    <Stack gap="sm">
                      {template.criteria.map((criteria, idx) => {
                        const scoreIndex = form.values.criteriaScores.findIndex(
                          (s) => s.criteria_id === criteria.id,
                        );
                        const scoreEntry = form.values.criteriaScores[scoreIndex];

                        return (
                          <Paper key={criteria.id} p="sm" withBorder>
                            <Stack gap="xs">
                              <Group justify="space-between" wrap="nowrap">
                                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                  <Text fw={500} size="sm">
                                    {idx + 1}. {criteria.criterion}
                                  </Text>
                                  <Badge size="xs" variant="light" color="blue">
                                    {criteria.weight}%
                                  </Badge>
                                </Group>

                                {/* Score input */}
                                {scoreIndex >= 0 &&
                                  (criteria.score_type === 'rating' ? (
                                    <NumberInput
                                      min={0}
                                      max={criteria.max_score}
                                      step={0.1}
                                      decimalScale={1}
                                      fixedDecimalScale
                                      disabled={isReadOnly}
                                      size="xs"
                                      style={{ width: 100 }}
                                      rightSection={
                                        <Text size="xs" c="dimmed" pr={4}>
                                          /{criteria.max_score}
                                        </Text>
                                      }
                                      rightSectionWidth={36}
                                      value={scoreEntry?.score ?? 0}
                                      onChange={(val) =>
                                        form.setFieldValue(
                                          `criteriaScores.${scoreIndex}.score`,
                                          typeof val === 'number' ? val : 0,
                                        )
                                      }
                                    />
                                  ) : (
                                    <Group gap="xs">
                                      <Button
                                        variant={scoreEntry?.score === 0 ? 'filled' : 'light'}
                                        color="red"
                                        size="xs"
                                        disabled={isReadOnly}
                                        onClick={() =>
                                          form.setFieldValue(
                                            `criteriaScores.${scoreIndex}.score`,
                                            0,
                                          )
                                        }
                                      >
                                        No (0)
                                      </Button>
                                      <Button
                                        variant={
                                          scoreEntry?.score === criteria.max_score
                                            ? 'filled'
                                            : 'light'
                                        }
                                        color="green"
                                        size="xs"
                                        disabled={isReadOnly}
                                        onClick={() =>
                                          form.setFieldValue(
                                            `criteriaScores.${scoreIndex}.score`,
                                            criteria.max_score,
                                          )
                                        }
                                      >
                                        Yes ({criteria.max_score})
                                      </Button>
                                    </Group>
                                  ))}
                              </Group>

                              {scoreIndex >= 0 && (
                                <Textarea
                                  placeholder="Note for this criterion (optional)..."
                                  size="xs"
                                  rows={1}
                                  disabled={isReadOnly}
                                  {...form.getInputProps(`criteriaScores.${scoreIndex}.note`)}
                                />
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Card>
                ) : (
                  <Card withBorder p="md">
                    <Text fw={600} mb="md">
                      Performance Score
                    </Text>
                    <Group align="center" gap="md">
                      <NumberInput
                        min={0}
                        max={100}
                        step={0.1}
                        decimalScale={1}
                        fixedDecimalScale
                        disabled={isReadOnly}
                        size="sm"
                        style={{ width: 120 }}
                        rightSection={
                          <Text size="xs" c="dimmed">
                            pts
                          </Text>
                        }
                        rightSectionWidth={36}
                        value={form.values.score}
                        onChange={(val) =>
                          form.setFieldValue('score', typeof val === 'number' ? val : 0)
                        }
                      />
                      <Badge size="lg" color={grade.color} variant="light">
                        {grade.label}
                      </Badge>
                      <Progress
                        value={form.values.score}
                        color={grade.color}
                        size="sm"
                        style={{ flex: 1 }}
                      />
                    </Group>
                  </Card>
                )}

                <Card withBorder p="md">
                  <Text fw={600} mb="md">
                    Feedback & Conclusion
                  </Text>
                  <Stack gap="md">
                    {contractType === 'probation' && (
                      <Select
                        label="Probation Result"
                        placeholder="Select result..."
                        data={probationResultOptions}
                        required
                        disabled={isReadOnly}
                        value={form.values.result || null}
                        onChange={(val) => form.setFieldValue('result', val ?? '')}
                        leftSection={<IconAlertCircle size={14} />}
                      />
                    )}
                    {contractType === 'intern' && (
                      <Select
                        label="Intern Result"
                        placeholder="Select result..."
                        data={internResultOptions}
                        required
                        disabled={isReadOnly}
                        value={form.values.result || null}
                        onChange={(val) => form.setFieldValue('result', val ?? '')}
                        leftSection={<IconAlertCircle size={14} />}
                      />
                    )}
                    <Textarea
                      label="Key Achievements"
                      placeholder="Outstanding work, notable projects, contributions..."
                      rows={3}
                      disabled={isReadOnly}
                      {...form.getInputProps('achievements')}
                    />
                    <Textarea
                      label="General Feedback"
                      placeholder="Performance, attitude, areas for improvement..."
                      rows={3}
                      disabled={isReadOnly}
                      {...form.getInputProps('comment')}
                    />
                  </Stack>
                </Card>

                {/* Actions */}
                {!isReadOnly && (
                  <Group justify="flex-end">
                    <Tooltip label="Save as draft — you can continue editing later">
                      <Button
                        variant="light"
                        leftSection={<IconDeviceFloppy size={16} />}
                        loading={createReview.isPending && !submitReview.isPending}
                        onClick={() => handleSave(false)}
                      >
                        Save Draft
                      </Button>
                    </Tooltip>
                    <Button
                      leftSection={<IconSend size={16} />}
                      loading={submitReview.isPending}
                      onClick={() => handleSave(true)}
                    >
                      Submit Review
                    </Button>
                  </Group>
                )}

                {isPrivilegedViewer && !canPrivilegedEditCurrentReview && (
                  <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                    You can only edit reviews for employees you directly manage or are assigned to
                    review.
                  </Alert>
                )}

                {(!isPrivilegedViewer || canPrivilegedEditCurrentReview) && isDone && (
                  <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                    This review has been {existingReview?.status}. No further edits allowed.
                  </Alert>
                )}
              </Stack>
            )}
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
